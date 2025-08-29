const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { setupClerk, authMiddleware } = require("./middleware/auth");
const userRoutes = require("./routes/user");

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Health check (no auth required)
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// GET /all-users - view all users in database (for testing, no auth required)
app.get("/all-users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { 
        projects: true,
        _count: {
          select: { projects: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Clerk Webhook: create user in DB on signup (no auth required)
app.post("/clerk/webhook", async (req, res) => {
  const event = req.body;
  if (event.type === "user.created") {
    const { id, email_addresses } = event.data;
    const email = email_addresses?.[0]?.email_address || null;
    try {
      await prisma.user.create({
        data: { 
          clerkId: id, 
          email: email || "no-email@example.com"
        },
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("DB Error (webhook):", err);
      return res.status(500).json({ error: "Database error" });
    }
  }
  res.status(200).json({ received: true });
});

// Setup Clerk middleware for protected routes
app.use(setupClerk);

// Protected routes
app.use("/users", userRoutes);

// Protected route: get projects for the logged-in user
app.get("/projects", authMiddleware, async (req, res) => {
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
app.post("/projects", authMiddleware, async (req, res) => {
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

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
