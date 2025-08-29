const { clerkMiddleware, requireAuth } = require("@clerk/express");

// First middleware to setup Clerk
const setupClerk = clerkMiddleware();

// Second middleware to require authentication
const authMiddleware = requireAuth({
  onError: (err, req, res) => {
    console.error("Auth error:", err);
    res.status(401).json({ error: "Unauthorized" });
  },
});

module.exports = { setupClerk, authMiddleware };
