// Portfolio Service - Fetches data from the upload-resume API
import api from './api';

export interface PersonalInfo {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface Experience {
  role: string;
  company: string;
  duration: string;
  description?: string;
  achievements: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  duration: string;
  role?: string;
  achievements: string[];
  links: {
    github?: string;
    demo?: string;
    documentation?: string;
  };
}

export interface Skills {
  [category: string]: string[];
}

export interface Education {
  degree: string;
  institution: string;
  duration: string;
  gpa?: string;
  relevant_coursework: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
}

export interface PortfolioData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  projects: Project[];
  skills: Skills;
  education: Education[];
  certifications: Certification[];
}

export interface ApiResponse {
  success: boolean;
  data: PortfolioData;
  extractedText: string;
}

// Sample data from the API (Dev Patil's portfolio)
const getSampleData = (): PortfolioData => {
  return {
    personalInfo: {
      name: "Dev Patil",
      title: "AI Integrations and Automations | Web Development (Full Stack)",
      email: "dev.patil1006@gmail.com",
      phone: "+91 9313316568",
      linkedin: "https://www.linkedin.com/in/devpatils",
      github: "github.com/DevPatils"
    },
    experience: [
      {
        role: "Founding Engineer and Frontend Developer",
        company: "SENTIO (Arweave India)",
        duration: "Oct 2024- Jan 2025",
        achievements: [
          "Creating an end to end Pipeline from Code Auditing to Process Monitoring for Arweave and AO.",
          "Working as a design and frontend lead.",
          "Redesign and developed the whole website in less than a month resulting in Securing a Grant of $5k."
        ]
      }
    ],
    projects: [
      {
        name: "MOODIFY (Spotify API integration)",
        description: "Built an AI-driven web app that analyzes user mood inputs and generates personalized Spotify playlists in real time. Leveraged Gemini 2.5 Flash for natural language processing and sentiment analysis to map moods to genres, tempos, and artists. Integrated the Spotify Web API for music data retrieval and seamless playback. Implemented Spotify OAuth 2.0 for secure user authentication and account integration. Developed a responsive frontend with React + Tailwind, ensuring a clean and user-friendly interface.",
        technologies: ["React", "Tailwind", "Gemini 2.5 Flash", "Spotify Web API"],
        duration: "(August 2025)",
        achievements: [],
        links: {
          demo: "https://moodify-nkyp.vercel.app"
        }
      },
      {
        name: "WEB CATCH (Chrome Extension)",
        description: "Developed Web Catch, an AI-powered Chrome extension that summarizes any web page into under 300 words. Leveraged the Gemini API to generate concise insights, enhancing browsing, research, and productivity. Built with HTML, CSS, and JavaScript, ensuring lightweight performance and seamless integration with Chrome.",
        technologies: ["HTML", "CSS", "JavaScript", "Gemini API"],
        duration: "(August 2025)",
        achievements: [],
        links: {}
      },
      {
        name: "Crux AI",
        description: "Developing Crux AI, an AI-powered platform that transforms resumes into personalized portfolio websites. Implemented resume parsing and leveraged Gemini to convert unstructured text into structured JSON. Building a dynamic portfolio generator using React + Tailwind with multiple responsive templates. Automated one-click deployment workflows for seamless hosting and publishing.",
        technologies: ["React", "Tailwind", "Gemini"],
        duration: "(Ongoing project September 2025)",
        achievements: [],
        links: {}
      }
    ],
    skills: {
      technical: ["AI", "Web Development", "Full Stack Development"],
      frameworks: ["ReactJS", "NextJS", "React-Native", "Tailwind CSS", "REST API", "Node.js"],
      databases: ["MongoDB", "SQLite", "Redis", "Postgres SQL"],
      tools: ["n8n", "langchain"],
      languages: ["Python", "JavaScript", "TypeScript", "C/C++", "SQL", "Solidity"]
    },
    education: [
      {
        degree: "B.E. in Computer Science and Engineering",
        institution: "ITM (SLS) Baroda University",
        duration: "Aug 2022 - Jun 2026",
        gpa: "9.96/10",
        relevant_coursework: []
      }
    ],
    certifications: []
  };
};

// Function to upload resume and fetch portfolio data
export const uploadResumeAndFetchData = async (file: File): Promise<PortfolioData | null> => {
  try {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await api.post('/generate/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = response.data;
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error('API returned unsuccessful response');
    }
  } catch (error) {
    console.error('Error uploading resume and fetching data:', error);
    return null;
  }
};

// Function to get default/sample portfolio data
export const fetchPortfolioData = async (): Promise<PortfolioData | null> => {
  try {
    // Return sample data for now
    // In a real implementation, you might want to fetch from a default endpoint
    return getSampleData();
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    return null;
  }
};

// Function to check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    await api.post('/generate/upload-resume', {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Even if it returns an error, if we get a response, the backend is running
    return true;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};
