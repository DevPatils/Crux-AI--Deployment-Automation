const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genrouter = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const axios = require("axios");

genrouter.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate a full HTML landing page using TailwindCSS. Requirements: ${prompt}. Keep inline JS minimal.`
            }
          ]
        }
      ]
    });

    const htmlCode = result.response.candidates[0]?.content.parts[0]?.text || "";
    res.json({ html: htmlCode });
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({ error: "Failed to generate landing page" });
  }
});





genrouter.post("/deploy", async (req, res) => {
  try {
    const { html, projectName } = req.body;

    if (!html || !projectName) {
      return res.status(400).json({ error: "Missing html or projectName" });
    }

    const vercelToken = process.env.VERCEL_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID; // optional

    const headers = {
      Authorization: `Bearer ${vercelToken}`,
      "Content-Type": "application/json",
    };

    if (teamId) {
      headers["X-Vercel-Team-Id"] = teamId;
    }

    // 1️⃣ Create project if it doesn't exist
    try {
      await axios.post(
        "https://api.vercel.com/v9/projects",
        {
          name: projectName,
          framework: null, // No framework, plain HTML
        },
        { headers }
      );
      console.log("Project created:", projectName);
    } catch (err) {
      if (err.response?.status === 409) {
        // Project already exists
        console.log("Project already exists:", projectName);
      } else {
        throw err;
      }
    }

    // 2️⃣ Deploy HTML to the project
    const deployPayload = {
      name: projectName,
      files: [
        {
          file: "index.html",
          data: html,
        },
      ],
      target: "production",
    };

    const deployRes = await axios.post(
      "https://api.vercel.com/v13/deployments",
      deployPayload,
      { headers }
    );

    res.json({
      message: "Deployment started",
      url: `https://${deployRes.data.url}`,
      details: deployRes.data,
    });
  } catch (err) {
    console.error("Deployment error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to deploy", details: err.response?.data });
  }
});




module.exports = genrouter;
