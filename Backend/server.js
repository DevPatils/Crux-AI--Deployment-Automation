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

// Configure CORS to allow requests from the deployed frontend and local dev
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://www.crux-ai.me',
      'https://crux-ai.me',
      'https://crux-ai-deployment-automation.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      console.log('CORS allowed origin:', origin);
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Origin', 
    'X-Requested-With',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Cache-Control',
    'Pragma',
    'User-Agent',
    'Referer'
  ],
  exposedHeaders: [
    'Content-Length',
    'Content-Type',
    'Authorization'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Debug middleware to log all requests with mobile detection
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'} - Mobile: ${isMobile}`);
  
  // Add mobile-specific headers
  if (isMobile) {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
