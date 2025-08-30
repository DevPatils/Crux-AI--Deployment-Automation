const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");

const userrouter = express.Router();
const prisma = new PrismaClient();

// POST /users/sync - sync Clerk user to database
userrouter.post("/sync", authMiddleware, async (req, res) => {
  try {
    const clerkId = req.auth.userId;      // Clerk user ID from new middleware
    const { email } = req.body;           // Email from frontend

    let user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
      user = await prisma.user.create({
        data: { 
          clerkId, 
          email: email || "no-email@example.com"
        },
      });
    } else {
      // Update email if provided
      if (email && user.email !== email) {
        user = await prisma.user.update({
          where: { clerkId },
          data: { email },
        });
      }
    }

    res.json(user);
  } catch (err) {
    console.error("User sync error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /users/me - get current user info
userrouter.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { clerkId: req.auth.userId },
      include: { projects: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = userrouter;
