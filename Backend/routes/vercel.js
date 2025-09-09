const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");
const axios = require("axios");

const router = express.Router();
const prisma = new PrismaClient();

// ✅ Get projects for the logged-in user
router.get("/projects", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: req.auth.userId },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
    });

    res.json(projects);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).send("Database error");
  }
});

// ✅ Create a new project
router.post("/projects", authMiddleware, async (req, res) => {
  const { title, prompt, contentJSON, deployedUrl } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: req.auth.userId },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const project = await prisma.project.create({
      data: {
        title,
        prompt,
        contentJSON,
        deployedUrl,
        userId: user.id,
      },
    });

    res.json(project);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).send("Database error");
  }
});

// ✅ Delete a project + try to delete from Vercel
router.delete("/projects/:id", authMiddleware, async (req, res) => {
  const projectId = Number(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: req.auth.userId },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== user.id) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Extract vercel project name
    let vercelProjectName = null;
    if (project.contentJSON?.finalName) {
      vercelProjectName = project.contentJSON.finalName;
    } else if (project.deployedUrl) {
      try {
        const host = new URL(project.deployedUrl).hostname;
        if (host.endsWith(".vercel.app")) {
          vercelProjectName = host.replace(".vercel.app", "");
        }
      } catch (_) {}
    }

    const vercelToken = process.env.VERCEL_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID;

    let vercelDeleted = false;
    if (vercelProjectName && vercelToken) {
      try {
        const headers = { Authorization: `Bearer ${vercelToken}` };
        if (teamId) headers["X-Vercel-Team-Id"] = teamId;

        const delUrl = `https://api.vercel.com/v9/projects/${encodeURIComponent(
          vercelProjectName
        )}`;
        const delResp = await axios.delete(delUrl, { headers });

        if ([200, 204].includes(delResp.status)) {
          vercelDeleted = true;
          console.log("Vercel project deleted:", vercelProjectName);
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          vercelDeleted = true;
          console.log("Vercel project not found, treating as deleted:", vercelProjectName);
        } else {
          console.error("Failed to delete Vercel project:", err?.response?.data || err.message);
          return res.status(500).json({
            error: "Failed to delete project from Vercel",
            details: err?.response?.data || err.message,
          });
        }
      }
    }

    await prisma.project.delete({ where: { id: projectId } });
    res.json({ success: true, vercelDeleted });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

module.exports = router;
