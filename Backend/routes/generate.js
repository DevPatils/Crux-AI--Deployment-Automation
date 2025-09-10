const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");

const genrouter = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const axios = require("axios");
const prisma = new PrismaClient();

const multer = require("multer");
const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    fieldSize: 10 * 1024 * 1024  // 10MB for text fields
  }
});

// Test endpoint for authentication and database saving
genrouter.post("/test-auth", authMiddleware, async (req, res) => {
  try {
    const clerkUserId = req.userId;
    console.log('Test auth - clerkUserId:', clerkUserId);

    if (!clerkUserId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Find the user in our database using clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId }
    });

    if (!user) {
      console.error('User not found in database with clerkId:', clerkUserId);
      return res.status(404).json({ error: "User not found in database" });
    }

    // Create a test project
    const project = await prisma.project.create({
      data: {
        title: `Test Project ${Date.now()}`,
        prompt: 'Test prompt',
        contentJSON: { test: 'data' },
        deployedUrl: 'https://test.example.com',
        userId: user.id
      }
    });

    console.log('Test project created:', project.id);

    res.json({
      success: true,
      message: "Authentication and database saving working",
      user: { id: user.id, clerkId: user.clerkId, email: user.email },
      project: project
    });
  } catch (error) {
    console.error('Test auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

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


genrouter.post("/deploy", authMiddleware, async (req, res) => {
  try {
    const { html, projectName, templateId } = req.body;
    const clerkUserId = req.userId; // from auth middleware

    console.log('Deploy request - clerkUserId:', clerkUserId);
    console.log('Deploy request - projectName:', projectName);
    console.log('Deploy request - templateId:', templateId);

    if (!html || !projectName) {
      return res.status(400).json({ error: "Missing html or projectName" });
    }

    if (!clerkUserId) {
      return res.status(401).json({ error: "User not authenticated" });
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

    // Validate project name format for Vercel and add crux-ai suffix to avoid conflicts
    let baseProjectName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    // Add "crux-ai" suffix for branding and to avoid conflicts
    const suffix = 'crux-ai';
    const validProjectName = `${baseProjectName}-${suffix}`;
    
    console.log(`Project name: "${projectName}" -> "${validProjectName}" (added suffix: ${suffix})`);

    // Ensure project name meets Vercel requirements
    if (validProjectName.length < 1 || validProjectName.length > 100) {
      return res.status(400).json({ error: "Project name must be between 1 and 100 characters" });
    }

    if (validProjectName.startsWith('-') || validProjectName.endsWith('-')) {
      return res.status(400).json({ error: "Project name cannot start or end with a hyphen" });
    }

    // Create project if it doesn't exist
    try {
      const createProjectResponse = await axios.post(
        "https://api.vercel.com/v9/projects",
        {
          name: validProjectName,
          framework: null, // No framework, plain HTML
        },
        { headers }
      );
      console.log("Project created:", validProjectName, createProjectResponse.data?.id);
    } catch (err) {
      if (err.response?.status === 409) {
        // Project already exists
        console.log("Project already exists:", validProjectName);
      } else {
        console.error("Project creation error:", err.response?.data || err.message);
        return res.status(500).json({ 
          error: "Failed to create project on Vercel", 
          details: err.response?.data?.error?.message || err.message 
        });
      }
    }

    // Deploy HTML to the project
    const deployPayload = {
      name: validProjectName,
      files: [
        {
          file: "index.html",
          data: html,
        },
      ],
      target: "production",
      projectSettings: {
        framework: null
      }
    };

    console.log('Deploying with payload:', {
      name: validProjectName,
      filesCount: deployPayload.files.length,
      target: deployPayload.target
    });

    let deployRes;
    try {
      deployRes = await axios.post(
        "https://api.vercel.com/v13/deployments",
        deployPayload,
        { headers }
      );
    } catch (deployErr) {
      console.error('Vercel deployment error:', deployErr.response?.data || deployErr.message);
      return res.status(500).json({ 
        error: "Failed to deploy to Vercel", 
        details: deployErr.response?.data?.error?.message || deployErr.message 
      });
    }

    console.log('Vercel deployment response:', {
      url: deployRes.data.url,
      ready: deployRes.data.ready,
      state: deployRes.data.state,
      id: deployRes.data.id
    });

    // Use the project name to create the predictable URL format: projectName.vercel.app
    const deployedUrl = `https://${validProjectName}.vercel.app`;

    // Save to database - find user by clerkId first
    try {
      // Find the user in our database using clerkId
      const user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId }
      });

      if (!user) {
        console.error('User not found in database with clerkId:', clerkUserId);
        return res.status(404).json({ error: "User not found in database" });
      }

      const project = await prisma.project.create({
        data: {
          title: `${projectName} (${validProjectName})`, // Show both original and final name
          prompt: `Portfolio (${templateId || 'default'})`,
          contentJSON: { 
            originalName: projectName,
            finalName: validProjectName,
            suffix: suffix 
          },
          deployedUrl: deployedUrl,
          userId: user.id // Use internal user ID
        }
      });
      console.log('Project saved to database:', project.id);
    } catch (dbErr) {
      console.error('Database save error:', dbErr);
      return res.status(500).json({ error: "Failed to save project to database" });
    }

    res.json({
      success: true,
      message: "Portfolio deployed and saved successfully",
      url: deployedUrl,
      originalName: projectName,
      finalName: validProjectName,
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
      "location": "string",
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "features": ["string"],
      "link": "string"
    }
  ],
  "achievements": [
    {
      "title": "string",
      "description": "string",
      "date": "string",
      "organization": "string"
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
      "description": "string",
      "coursework": ["string"]
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
1. Project details with single most relevant link (prefer GitHub, then demo, then documentation)
2. Separate achievements section for awards, certifications, recognitions not tied to specific jobs
3. Technical skills categorized properly
4. Work experience with specific achievements
5. Personal contact information and professional links
6. Only include fields that have actual data - leave out empty fields

Resume Text: ${text}`
              }
            ]
          }
        ]
      });

      // Defensive logging: capture full AI response for debugging
      try {
        console.log('Gemini raw response:', JSON.stringify(result, null, 2));
      } catch (logErr) {
        console.log('Could not stringify Gemini response');
      }

      let jsonData = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      jsonData = String(jsonData).replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

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

// Handle OPTIONS request for upload-resume route
genrouter.options("/upload-resume", (req, res) => {
  const allowedOrigins = [
    'https://www.crux-ai.me',
    'https://crux-ai.me',
    'https://crux-ai-deployment-automation.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.sendStatus(200);
});

genrouter.post("/upload-resume", upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]), async (req, res) => {
  // Set specific CORS headers for this route
  const allowedOrigins = [
    'https://www.crux-ai.me',
    'https://crux-ai.me',
    'https://crux-ai-deployment-automation.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  
  try {
    const files = req.files;
    const resumeFile = files?.resume?.[0];
    const avatarFile = files?.avatar?.[0];
    const { templateId } = req.body;
    
    if (!resumeFile) {
      return res.status(400).json({ error: "Resume file is required" });
    }

    if (!templateId) {
      return res.status(400).json({ error: "Template ID is required" });
    }

    // Validate resume file type
    const allowedMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMimeTypes.includes(resumeFile.mimetype)) {
      // Clean up uploaded files
      try { fs.unlinkSync(resumeFile.path); } catch (e) { console.error('Resume cleanup error:', e); }
      if (avatarFile) {
        try { fs.unlinkSync(avatarFile.path); } catch (e) { console.error('Avatar cleanup error:', e); }
      }
      return res.status(400).json({ error: "Only PDF and DOCX files are supported" });
    }

    // Validate avatar file type if provided
    if (avatarFile) {
      const allowedAvatarTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedAvatarTypes.includes(avatarFile.mimetype)) {
        // Clean up uploaded files
        try { fs.unlinkSync(resumeFile.path); } catch (e) { console.error('Resume cleanup error:', e); }
        try { fs.unlinkSync(avatarFile.path); } catch (e) { console.error('Avatar cleanup error:', e); }
        return res.status(400).json({ error: "Avatar must be a JPEG, PNG, or WebP image" });
      }
      
      // Check avatar file size (max 5MB)
      if (avatarFile.size > 5 * 1024 * 1024) {
        try { fs.unlinkSync(resumeFile.path); } catch (e) { console.error('Resume cleanup error:', e); }
        try { fs.unlinkSync(avatarFile.path); } catch (e) { console.error('Avatar cleanup error:', e); }
        return res.status(400).json({ error: "Avatar file size must be less than 5MB" });
      }
    }

    // Read and parse the resume file content
    let text = "";

    try {
      if (resumeFile.mimetype === 'application/pdf') {
        const pdfParse = require("pdf-parse");
        const dataBuffer = fs.readFileSync(resumeFile.path);
        const pdfData = await pdfParse(dataBuffer);
        text = pdfData.text;
      } else if (resumeFile.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOCX files, we'll use a simple text extraction
        // Note: You might want to install 'mammoth' package for better DOCX parsing
        text = "DOCX parsing not fully implemented. Please use PDF format.";
      }

      // Clean up the uploaded resume file
      try { fs.unlinkSync(resumeFile.path); } catch (e) { console.error('Resume cleanup error:', e); }

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
      "location": "string",
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "features": ["string"],
      "link": "string"
    }
  ],
  "achievements": [
    {
      "title": "string",
      "description": "string",
      "date": "string",
      "organization": "string"
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
      "description": "string",
      "coursework": ["string"]
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
1. Project details with single most relevant link (prefer GitHub, then demo, then documentation)
2. Separate achievements section for awards, certifications, recognitions not tied to specific jobs
3. Technical skills categorized properly
4. Work experience with specific achievements
5. Personal contact information and professional links
6. Only include fields that have actual data - leave out empty fields

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
        
        // Process avatar if provided
        if (avatarFile) {
          try {
            const avatarBuffer = fs.readFileSync(avatarFile.path);
            const base64Avatar = avatarBuffer.toString('base64');
            const mimeType = avatarFile.mimetype;
            const dataUrl = `data:${mimeType};base64,${base64Avatar}`;
            
            // Add profile picture to parsed data
            if (!parsedData.personalInfo) {
              parsedData.personalInfo = {};
            }
            parsedData.personalInfo.profilePicture = dataUrl;
            
            // Clean up avatar file
            try { fs.unlinkSync(avatarFile.path); } catch (e) { console.error('Avatar cleanup error:', e); }
          } catch (avatarError) {
            console.error('Avatar processing error:', avatarError);
            // Clean up avatar file on error
            try { fs.unlinkSync(avatarFile.path); } catch (e) { console.error('Avatar cleanup error:', e); }
            // Don't fail the entire request for avatar processing errors
          }
        }
        
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
      // Clean up files on error
      try {
        fs.unlinkSync(resumeFile.path);
      } catch (cleanupError) {
        console.error("Resume file cleanup error:", cleanupError);
      }
      
      if (avatarFile) {
        try {
          fs.unlinkSync(avatarFile.path);
        } catch (cleanupError) {
          console.error("Avatar file cleanup error:", cleanupError);
        }
      }

      console.error("File processing error:", fileError);
      res.status(500).json({ error: "Failed to process the uploaded file" });
    }

  } catch (err) {
    console.error("Upload-resume error:", err);

    // Clean up files if they exist
    const files = req.files;
    if (files?.resume?.[0]) {
      try {
        fs.unlinkSync(files.resume[0].path);
      } catch (cleanupError) {
        console.error("Resume cleanup error:", cleanupError);
      }
    }
    
    if (files?.avatar?.[0]) {
      try {
        fs.unlinkSync(files.avatar[0].path);
      } catch (cleanupError) {
        console.error("Avatar cleanup error:", cleanupError);
      }
    }

    res.status(500).json({ error: "Failed to extract resume data" });
  }
});



module.exports = genrouter;
