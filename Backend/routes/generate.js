const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

const genrouter = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const axios = require("axios");

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// Get available templates
genrouter.get("/templates", async (req, res) => {
  try {
    const results = [];

    // First, try backend templates folder
    const backendTemplatesDir = path.join(__dirname, '../templates');
    if (fs.existsSync(backendTemplatesDir)) {
      const backendFiles = fs.readdirSync(backendTemplatesDir).filter(f => f.endsWith('.html'));
      backendFiles.forEach(file => {
        const templateId = file.replace('.html', '');
        results.push({ id: templateId, name: templateId.split('-').map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(' '), source: 'backend' });
      });
    }

    // Then, try frontend public templates
    const frontendTemplatesDir = path.join(__dirname, '../..', 'Frontend', 'public', 'templates');
    if (fs.existsSync(frontendTemplatesDir)) {
      const frontFiles = fs.readdirSync(frontendTemplatesDir).filter(f => f.endsWith('.html'));
      frontFiles.forEach(file => {
        const templateId = file.replace('.html', '');
        // avoid duplicates
        if (!results.find(r => r.id === templateId)) {
          results.push({ id: templateId, name: templateId.split('-').map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(' '), source: 'frontend' });
        }
      });
    }

    res.json({ success: true, templates: results });
  } catch (error) {
    console.error("Templates fetch error:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});


genrouter.post("/deploy", async (req, res) => {
  try {
    const { html, projectName } = req.body;

    if (!html || !projectName) {
      return res.status(400).json({ error: "Missing html or projectName" });
    }

    // Basic validation to avoid deploying empty boilerplates
    const htmlStr = String(html || '');
    console.log('Deploy request - html length:', htmlStr.length);
    if (htmlStr.trim().length < 80 || !/(<html|<body|<div|<section|<header)/i.test(htmlStr)) {
      return res.status(400).json({ error: 'Provided HTML appears empty or invalid. Aborting deployment.' });
    }

    const vercelToken = process.env.VERCEL_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID; // optional

    if (!vercelToken) {
      return res.status(500).json({ error: "Vercel token not configured" });
    }

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

    // Deploy HTML to the project
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
      success: true,
      message: "Portfolio deployed successfully",
      url: `https://${deployRes.data.url}`,
      deploymentId: deployRes.data.id,
      details: deployRes.data,
    });
  } catch (err) {
    console.error("Deployment error:", err.response?.data || err.message);
    res.status(500).json({ 
      success: false,
      error: "Failed to deploy portfolio", 
      details: err.response?.data || err.message 
    });
  }
});

// Combined route for upload, populate, and deploy in one step
genrouter.post("/portfolio", upload.single("resume"), async (req, res) => {
  try {
    const file = req.file;
    const { templateId, projectName } = req.body;
    
    console.log("=== PORTFOLIO REQUEST DEBUG ===");
    console.log("templateId received:", templateId);
    console.log("projectName received:", projectName);
    console.log("file received:", file ? file.originalname : "No file");
    console.log("===============================");
    
    if (!file) {
      return res.status(400).json({ error: "Resume file is required" });
    }

    if (!templateId) {
      return res.status(400).json({ error: "Template ID is required" });
    }

    if (!projectName) {
      return res.status(400).json({ error: "Project name is required" });
    }

    // Validate file type
    const allowedMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Only PDF and DOCX files are supported" });
    }

    // Step 1: Extract resume data
    let text = "";
    try {
      if (file.mimetype === 'application/pdf') {
        const pdfParse = require("pdf-parse");
        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdfParse(dataBuffer);
        text = pdfData.text;
      }
      
      fs.unlinkSync(file.path);

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: "Could not extract text from the uploaded file" });
      }

      // Step 2: Parse with AI
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

Resume Text: ${text}`
              }
            ]
          }
        ]
      });

      let jsonData = result.response.candidates[0]?.content.parts[0]?.text || "{}";
      jsonData = jsonData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const parsedData = JSON.parse(jsonData);
      
      // Step 3: Generate HTML from template
      // Prefer templateHtml sent from the frontend (templates served from frontend public/templates/<id>.html)
      const templateHtmlFromClient = req.body.templateHtml;
      let populatedHTML = null;

      if (templateHtmlFromClient && typeof templateHtmlFromClient === 'string' && templateHtmlFromClient.trim().length > 0) {
        console.log('Using template HTML provided by frontend');
        try {
          const template = handlebars.compile(templateHtmlFromClient);
          populatedHTML = template(parsedData);
        } catch (tplErr) {
          console.error('Failed to compile templateHtml from client:', tplErr);
          return res.status(500).json({ error: 'Failed to compile provided template' });
        }
      } else {
        // Fallback to server-side templates folder
        const templatePath = path.join(__dirname, '../templates', `${templateId}.html`);
        console.log("Falling back to server template path:", templatePath);

        if (!fs.existsSync(templatePath)) {
          return res.status(400).json({ error: `Template '${templateId}' not found on server and no templateHtml provided` });
        }

        const templateContent = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateContent);
        populatedHTML = template(parsedData);
      }
      
      // Step 4: Deploy to Vercel
      const vercelToken = process.env.VERCEL_TOKEN;
      if (!vercelToken) {
        return res.status(500).json({ error: "Vercel token not configured" });
      }

      const headers = {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      };

      // Create project if it doesn't exist
      try {
        await axios.post(
          "https://api.vercel.com/v9/projects",
          { name: projectName, framework: null },
          { headers }
        );
      } catch (err) {
        if (err.response?.status !== 409) {
          throw err;
        }
      }

      // Deploy HTML
      // Validate populated HTML before deploy
      const populatedStr = String(populatedHTML || '');
      console.log('Populated HTML length:', populatedStr.length);
      if (populatedStr.trim().length < 80 || !/(<html|<body|<div|<section|<header)/i.test(populatedStr)) {
        return res.status(400).json({ error: 'Generated HTML appears empty or invalid. Aborting deployment.' });
      }

      const deployPayload = {
        name: projectName,
        files: [{ file: "index.html", data: populatedHTML }],
        target: "production",
      };

      const deployRes = await axios.post(
        "https://api.vercel.com/v13/deployments",
        deployPayload,
        { headers }
      );

      res.json({
        success: true,
        message: "Portfolio created and deployed successfully",
        data: parsedData,
        html: populatedHTML,
        templateId: templateId,
        deployment: {
          url: `https://${deployRes.data.url}`,
          deploymentId: deployRes.data.id,
          projectName: projectName
        }
      });

    } catch (error) {
      console.error("Portfolio generation error:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to generate and deploy portfolio",
        details: error.message 
      });
    }

  } catch (err) {
    console.error("Portfolio route error:", err);
    
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("File cleanup error:", cleanupError);
      }
    }

    res.status(500).json({ error: "Failed to process portfolio request" });
  }
});






genrouter.post("/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    const file = req.file;
    const { templateId } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: "Resume file is required" });
    }

    if (!templateId) {
      return res.status(400).json({ error: "Template ID is required" });
    }

    // Validate file type
    const allowedMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Only PDF and DOCX files are supported" });
    }

    // Read and parse the file content
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
        
        // Generate HTML from template
        const templateHtmlFromClient = req.body.templateHtml;
        let populatedHTML = null;

        if (templateHtmlFromClient && typeof templateHtmlFromClient === 'string' && templateHtmlFromClient.trim().length > 0) {
          try {
            const template = handlebars.compile(templateHtmlFromClient);
            populatedHTML = template(parsedData);
          } catch (tplErr) {
            console.error('Failed to compile provided templateHtml:', tplErr);
            return res.status(500).json({ error: 'Failed to compile provided template' });
          }
        } else {
          // Fallback to server-side templates folder
          const templatePath = path.join(__dirname, '../templates', `${templateId}.html`);

          if (!fs.existsSync(templatePath)) {
            return res.status(400).json({ error: `Template '${templateId}' not found on server and no templateHtml provided` });
          }

          const templateContent = fs.readFileSync(templatePath, 'utf8');
          const template = handlebars.compile(templateContent);
          populatedHTML = template(parsedData);
        }

        res.json({
          success: true,
          data: parsedData,
          html: populatedHTML,
          templateId: templateId,
          extractedText: text.substring(0, 500) + (text.length > 500 ? "..." : "") // First 500 chars for debugging
        });
  // Sanity check log
  console.log('upload-resume: compiled html length=', String(populatedHTML || '').length);
        
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
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("File cleanup error:", cleanupError);
      }
    }

    res.status(500).json({ error: "Failed to extract resume data" });
  }
});



module.exports = genrouter;
