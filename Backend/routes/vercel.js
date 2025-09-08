const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");
const axios = require("axios");

const router = express.Router();
const prisma = new PrismaClient();

// Protected route: get projects for the logged-in user
router.get("/projects", authMiddleware, async (req, res) => {
  try {
    // Ensure user exists in DB
    const user = await prisma.user.findUnique({
      where: { clerkId: req.auth.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
    });

    res.json(projects);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).send("Database error");
  }
});

// Protected route: create a new project
router.post("/projects", authMiddleware, async (req, res) => {
  const { title, prompt, contentJSON, deployedUrl } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: req.auth.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

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

// Protected route: delete a project (and attempt to delete from Vercel)
router.delete('/projects/:id', authMiddleware, async (req, res) => {
  const projectId = Number(req.params.id);
  try {
    const user = await prisma.user.findUnique({ where: { clerkId: req.auth.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== user.id) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Try to derive the vercel project name
    let vercelProjectName = null;
    try {
      const content = project.contentJSON || {};
      if (content && typeof content === 'object' && content.finalName) {
        vercelProjectName = content.finalName;
      }
    } catch (e) {
      // ignore
    }

    // Fallback: parse from deployedUrl like https://<project>.vercel.app
    if (!vercelProjectName && project.deployedUrl) {
      try {
        const url = new URL(project.deployedUrl);
        const host = url.hostname || '';
        if (host.endsWith('.vercel.app')) {
          vercelProjectName = host.replace('.vercel.app', '');
        }
      } catch (e) {
        // ignore
      }
    }

    const vercelToken = process.env.VERCEL_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID;
    const headers = vercelToken ? { Authorization: `Bearer ${vercelToken}` } : {};
    if (teamId) headers['X-Vercel-Team-Id'] = teamId;

    let vercelDeleted = false;
    if (vercelProjectName && vercelToken) {
      try {
        // Attempt to delete project by name via Vercel API
        const delUrl = `https://api.vercel.com/v9/projects/${encodeURIComponent(vercelProjectName)}`;
        const delResp = await axios.delete(delUrl, { headers });
        if (delResp.status === 200 || delResp.status === 204) {
          vercelDeleted = true;
          console.log('Vercel project deleted:', vercelProjectName);
        }
      } catch (err) {
        // If Vercel responds 404 (not found), treat as deleted; otherwise surface error
        const status = err?.response?.status;
        if (status === 404) {
          vercelDeleted = true;
          console.log('Vercel project not found (treated as deleted):', vercelProjectName);
        } else {
          console.error('Failed to delete Vercel project:', err?.response?.data || err.message);
          return res.status(500).json({ error: 'Failed to delete project from Vercel', details: err?.response?.data || err.message });
        }
      }
    }

    // Delete from DB
    await prisma.project.delete({ where: { id: projectId } });

    return res.json({ success: true, vercelDeleted });
  } catch (err) {
    console.error('Error deleting project:', err);
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
