const { clerkMiddleware, requireAuth } = require("@clerk/express");

// First middleware to setup Clerk
const setupClerk = clerkMiddleware();

// Second middleware to require authentication and set userId
const authMiddleware = [requireAuth({
  onError: (err, req, res) => {
    console.error("Auth error:", err);
    res.status(401).json({ error: "Unauthorized" });
  },
}), (req, res, next) => {
  // Extract userId from Clerk and set it on req for consistency
  req.userId = req.auth.userId;
  next();
}];



module.exports = { setupClerk, authMiddleware };
