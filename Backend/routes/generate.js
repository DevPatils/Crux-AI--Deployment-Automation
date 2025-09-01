const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genrouter = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const axios = require("axios");

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

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

    // Create project if it doesn't exist
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

    // 2️ Deploy HTML to the project
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






genrouter.post("/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Resume file is required" });
    }

    // Validate file type
    const allowedMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      // Clean up uploaded file
      const fs = require("fs");
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Only PDF and DOCX files are supported" });
    }

    // Read and parse the file content
    const fs = require("fs");
    let text = "";

    try {
      if (file.mimetype === 'application/pdf') {
        const pdfParse = require("pdf-parse");
        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdfParse(dataBuffer);
        text = pdfData.text;
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOCX files, we'll use a simple text extraction
        // Note: You might want to install 'mammoth' package for better DOCX parsing
        text = "DOCX parsing not fully implemented. Please use PDF format.";
      }

      // Clean up the uploaded file
      fs.unlinkSync(file.path);

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: "Could not extract text from the uploaded file" });
      }

      // Send the extracted text to Gemini for JSON parsing
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Extract structured JSON from this resume text. Return valid JSON only, no markdown formatting. 

Required structure:
{
  "personalInfo": {
    "name": "string",
    "title": "string", 
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string"
  },
  "experience": [
    {
      "role": "string",
      "company": "string", 
      "duration": "string",
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "duration": "string",
      "role": "string",
      "achievements": ["string"],
      "links": {
        "github": "string",
        "demo": "string",
        "documentation": "string"
      }
    }
  ],
  "skills": {
    "technical": ["string"],
    "frameworks": ["string"], 
    "databases": ["string"],
    "tools": ["string"],
    "languages": ["string"]
  },
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "duration": "string",
      "gpa": "string",
      "relevant_coursework": ["string"]
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string", 
      "date": "string",
      "credential_id": "string"
    }
  ]
}

Focus especially on extracting:
1. All project details including technologies used, project descriptions, achievements, and any links
2. Technical skills categorized properly
3. Work experience with specific achievements
4. Personal contact information and professional links

Resume Text: ${text}`
              }
            ]
          }
        ]
      });

      let jsonData = result.response.candidates[0]?.content.parts[0]?.text || "{}";

      // Clean up the response if it contains markdown formatting
      jsonData = jsonData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      try {
        const parsedData = JSON.parse(jsonData);
        res.json({
          success: true,
          data: parsedData,
          extractedText: text.substring(0, 500) + (text.length > 500 ? "..." : "") // First 500 chars for debugging
        });
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        res.status(500).json({
          error: "Failed to parse AI response as JSON",
          rawResponse: jsonData,
          extractedText: text.substring(0, 500) + (text.length > 500 ? "..." : "")
        });
      }

    } catch (fileError) {
      // Clean up file on error
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.error("File cleanup error:", cleanupError);
      }

      console.error("File processing error:", fileError);
      res.status(500).json({ error: "Failed to process the uploaded file" });
    }

  } catch (err) {
    console.error("Upload-resume error:", err);

    // Clean up file if it exists
    if (req.file) {
      try {
        const fs = require("fs");
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("File cleanup error:", cleanupError);
      }
    }

    res.status(500).json({ error: "Failed to extract resume data" });
  }
});



module.exports = genrouter;
