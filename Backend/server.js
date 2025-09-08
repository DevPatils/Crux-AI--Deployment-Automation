const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { setupClerk, authMiddleware } = require("./middleware/auth");
const userRoutes = require("./routes/user");
const generateRoutes = require("./routes/generate");
const vercelRoutes = require("./routes/vercel");

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Health check (no auth required)
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});


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


app.use(setupClerk);


app.use("/users", userRoutes);
app.use("/generate", generateRoutes);
app.use("/vercel", vercelRoutes);


app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
