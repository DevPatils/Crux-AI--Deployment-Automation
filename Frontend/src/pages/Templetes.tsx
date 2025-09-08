import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useToast } from '../components/useToast';


interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  features: string[];
  category: string;
}

const Templates: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const toast = useToast();

  // Available templates - map to files in Frontend/public/templates
  const templates: Template[] = [
    {
      id: 'modern-professional',
      name: 'Modern Professional',
      description: 'A clean, modern portfolio design perfect for developers and creatives.',
      preview: '/templates/modern-professional.html',
      features: ['Responsive Design','Project Showcase','Contact Form','Modern Typography'],
      category: 'Professional'
    },
    {
      id: 'dark-professional',
      name: 'Dark Professional',
      description: 'A complete website-style portfolio with navigation, hero section, and smooth scrolling animations for modern professionals.',
      preview: '/templates/dark-professional.html',
      features: ['Navigation Bar','Hero Section','Smooth Scrolling','Website Layout','Dark Theme','Animations'],
      category: 'Professional'
    },
    {
      id: 'terminal_style',
      name: 'Terminal Style',
      description: 'A developer-themed terminal interface portfolio with command-line aesthetics and Matrix rain effects.',
      preview: '/templates/terminal_style.html',
      features: ['Terminal Interface','Matrix Rain Effect','Command-Line Theme','Developer Focused'],
      category: 'Developer'
    }
  ];

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplate(templateId);

    // persist selected template id
    try { localStorage.setItem('selectedTemplate', templateId); } catch (e) { console.warn('localStorage write failed', e); }

    // fetch template HTML from public/templates and persist for CreatePortfolio
    try {
      const resp = await fetch(`/templates/${templateId}.html`);
      if (resp.ok) {
        const html = await resp.text();
        try { localStorage.setItem('selectedTemplateHtml', html); } catch (e) { console.warn('Could not save template HTML', e); }
      }
    } catch (err) {
      console.warn('Failed to fetch template HTML on select', err);
    }
  };

  const handleProceedWithTemplate = () => {
    if (!isSignedIn) {
      toast.push('Please sign in to continue with template selection.', { type: 'warning' });
      navigate('/signin');
      return;
    }

    if (!selectedTemplate) {
      toast.push('Please select a template first.', { type: 'warning' });
      return;
    }

  try { localStorage.setItem('selectedTemplate', selectedTemplate); } catch (e) { console.warn('localStorage write failed', e); }
  const templateHtml = localStorage.getItem('selectedTemplateHtml');
  navigate(`/create-portfolio?template=${selectedTemplate}`, { state: { templateId: selectedTemplate, templateHtml } });
  };

  const handlePreviewTemplate = async (templateId: string) => {
    try {
      const resp = await fetch(`/templates/${templateId}.html`);
      if (!resp.ok) throw new Error('Template not found');
      let html = await resp.text();
      
      // Add dummy data for preview
      const dummyData: {
        personalInfo: {
          name: string;
          title: string;
          location: string;
          email: string;
          phone: string;
          summary: string;
          linkedin: string;
          github: string;
          portfolio: string;
        };
        experience: Array<{
          role: string;
          company: string;
          location: string;
          duration: string;
          description: string;
          achievements: string[];
        }>;
        projects: Array<{
          name: string;
          description: string;
          technologies: string[];
          features: string[];
          link: string;
        }>;
        achievements: Array<{
          title: string;
          description: string;
          date: string;
          organization: string;
        }>;
        skills: {
          technical: string[];
          frameworks: string[];
          databases: string[];
          tools: string[];
          languages: string[];
        };
        education: Array<{
          degree: string;
          institution: string;
          duration: string;
          gpa?: string;
          description: string;
          coursework?: string[];
        }>;
      } = {
        personalInfo: {
          name: "John Developer",
          title: "Full Stack Developer",
          location: "San Francisco, CA",
          email: "john.developer@email.com",
          phone: "+1 (555) 123-4567",
          summary: "Passionate full-stack developer with 5+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud technologies. Love solving complex problems and creating user-friendly solutions.",
          linkedin: "https://linkedin.com/in/johndeveloper",
          github: "https://github.com/johndeveloper",
          portfolio: "https://johndeveloper.dev"
        },
        experience: [
          {
            role: "Senior Full Stack Developer",
            company: "Tech Innovators Inc.",
            location: "San Francisco, CA",
            duration: "2022 - Present",
            description: "Lead development of microservices architecture serving 1M+ users. Collaborated with cross-functional teams to deliver high-quality software solutions.",
            achievements: [
              "Improved application performance by 40% through optimization",
              "Led a team of 5 developers on critical product features",
              "Implemented CI/CD pipeline reducing deployment time by 60%"
            ]
          },
          {
            role: "Frontend Developer",
            company: "Digital Solutions LLC",
            location: "San Francisco, CA",
            duration: "2020 - 2022",
            description: "Developed responsive web applications using React and TypeScript. Worked closely with designers to implement pixel-perfect UI components.",
            achievements: [
              "Built 15+ reusable React components increasing development speed",
              "Mentored 3 junior developers on best practices",
              "Reduced bundle size by 30% through code optimization"
            ]
          }
        ],
        projects: [
          {
            name: "E-Commerce Platform",
            description: "A full-stack e-commerce solution with real-time inventory management, payment processing, and admin dashboard.",
            technologies: ["React", "Node.js", "MongoDB", "Stripe", "AWS"],
            features: [
              "Real-time inventory tracking",
              "Secure payment processing",
              "Admin dashboard with analytics",
              "Mobile-responsive design"
            ],
            link: "https://github.com/johndeveloper/ecommerce-platform"
          },
          {
            name: "Task Management App",
            description: "A collaborative task management application with real-time updates, file sharing, and team communication features.",
            technologies: ["Vue.js", "Express", "PostgreSQL", "Socket.io", "Docker"],
            features: [
              "Real-time collaboration",
              "File upload and sharing",
              "Team chat integration",
              "Project timeline visualization"
            ],
            link: "https://github.com/johndeveloper/task-manager"
          },
          {
            name: "Weather Analytics Dashboard",
            description: "A data visualization dashboard showing weather patterns and climate data with interactive charts and maps.",
            technologies: ["React", "D3.js", "Python", "FastAPI", "Redis"],
            features: [
              "Interactive data visualizations",
              "Historical weather analysis",
              "Real-time weather updates",
              "Exportable reports"
            ],
            link: "https://github.com/johndeveloper/weather-dashboard"
          }
        ],
        achievements: [
          {
            title: "AWS Certified Solutions Architect",
            description: "Professional certification demonstrating expertise in designing distributed systems on AWS cloud platform.",
            date: "2023",
            organization: "Amazon Web Services"
          },
          {
            title: "Best Innovation Award",
            description: "Recognized for developing an AI-powered code review tool that improved team productivity by 25%.",
            date: "2022",
            organization: "Tech Innovators Inc."
          },
          {
            title: "Open Source Contributor",
            description: "Active contributor to popular open source projects with 500+ GitHub stars earned.",
            date: "2021-Present",
            organization: "GitHub Community"
          }
        ],
        skills: {
          technical: ["JavaScript", "TypeScript", "Python", "Java"],
          frameworks: ["React", "Vue.js", "Express", "FastAPI"],
          databases: ["MongoDB", "PostgreSQL", "Redis"],
          tools: ["Docker", "AWS", "Git", "Webpack"],
          languages: ["English", "Spanish"]
        },
        education: [
          {
            degree: "Bachelor of Science in Computer Science",
            institution: "University of California, Berkeley",
            duration: "2016 - 2020",
            gpa: "3.8/4.0",
            description: "Focused on software engineering, algorithms, and data structures. Graduated Magna Cum Laude.",
            coursework: ["Data Structures", "Algorithms", "Software Engineering", "Database Systems", "Machine Learning"]
          },
          {
            degree: "Full Stack Web Development Bootcamp",
            institution: "General Assembly",
            duration: "2020",
            description: "Intensive 12-week program covering modern web development technologies and best practices."
          }
        ]
      };

      // Replace handlebars placeholders with dummy data for preview
      (Object.keys(dummyData) as Array<keyof typeof dummyData>).forEach(key => {
        const value = dummyData[key];
        if (Array.isArray(value)) {
          // Handle arrays like experience, projects, etc.
          html = html.replace(new RegExp(`{{#if ${key}}}([\\s\\S]*?){{/if}}`, 'g'), '$1');
          html = html.replace(new RegExp(`{{#each ${key}}}([\\s\\S]*?){{/each}}`, 'g'), (_, content) => {
            return value.map(() => content).join('');
          });
        } else if (typeof value === 'object') {
          // Handle objects like personalInfo
          Object.keys(value).forEach(subKey => {
            const regex = new RegExp(`{{#if ${key}\\.${subKey}}}([\\s\\S]*?){{/if}}`, 'g');
            html = html.replace(regex, '$1');
            html = html.replace(new RegExp(`{{${key}\\.${subKey}}}`, 'g'), (value as Record<string, string>)[subKey]);
          });
        }
      });

      // Handle nested arrays and objects
      dummyData.experience?.forEach((exp: {
        role: string;
        company: string;
        location: string;
        duration: string;
        description: string;
        achievements: string[];
      }) => {
        if (exp.achievements) {
          exp.achievements.forEach((achievement: string) => {
            html = html.replace('{{this}}', achievement);
          });
        }
      });

      dummyData.projects?.forEach((project: {
        name: string;
        description: string;
        technologies: string[];
        features: string[];
        link: string;
      }) => {
        if (project.technologies) {
          project.technologies.forEach((tech: string) => {
            html = html.replace('{{this}}', tech);
          });
        }
        if (project.features) {
          project.features.forEach((feature: string) => {
            html = html.replace('{{this}}', feature);
          });
        }
      });

      dummyData.education?.forEach((edu: {
        degree: string;
        institution: string;
        duration: string;
        gpa?: string;
        description: string;
        coursework?: string[];
      }) => {
        if (edu.coursework) {
          edu.coursework.forEach((course: string) => {
            html = html.replace('{{this}}', course);
          });
        }
      });

      // Clean up any remaining handlebars syntax
      html = html.replace(/{{[^}]*}}/g, '');
      html = html.replace(/{{#if[^}]*}}/g, '');
      html = html.replace(/{{\/if}}/g, '');
      html = html.replace(/{{#each[^}]*}}/g, '');
      html = html.replace(/{{\/each}}/g, '');

      setPreviewHtml(html);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Preview load error:', err);
      toast.push('Failed to load template preview.', { type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
  
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Template
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select from our professionally designed templates to create your perfect portfolio. 
            Each template is fully customizable and responsive.
          </p>
        </div>

        {/* Preview Modal */}
        {isPreviewOpen && previewHtml && (
          <div className="fixed inset-0 z-50 bg-white overflow-hidden">
            {/* Full screen header bar */}
            <div className="flex items-center justify-between bg-gray-100 border-b border-gray-300 px-4 py-2 h-12">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm text-gray-600 ml-4">Portfolio Preview</span>
              </div>
              <button
                onClick={() => { setIsPreviewOpen(false); setPreviewHtml(null); }}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200"
              >
                ×
              </button>
            </div>
            
            {/* Full screen content */}
            <div className="w-full h-[calc(100vh-3rem)] overflow-auto bg-white">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                style={{
                  minHeight: '100%',
                  backgroundColor: 'white'
                }}
                title="Template Preview"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        )}

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all duration-300 cursor-pointer hover:shadow-xl ${
                selectedTemplate === template.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              {/* Template Preview */}
              <div className="relative h-64 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Preview Available</p>
                </div>
                
                {selectedTemplate === template.id && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{template.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    {template.category}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {template.description}
                </p>

                {/* Features */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {template.features.slice(0, 4).map((feature, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                    {template.features.length > 4 && (
                      <span className="text-xs text-gray-500">
                        +{template.features.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewTemplate(template.id);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                  >
                    Preview
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTemplateSelect(template.id);
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                      selectedTemplate === template.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                  >
                    {selectedTemplate === template.id ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Coming Soon Templates */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-dashed border-gray-300">
            <div className="h-64 bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">More Templates</p>
                <p className="text-xs text-gray-400">Coming Soon</p>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Creative & Minimal</h3>
              <p className="text-gray-400 text-sm mb-4">
                More exciting templates are in development. Stay tuned for creative, minimal, and industry-specific designs.
              </p>
              <button
                disabled
                className="w-full bg-gray-100 text-gray-400 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        {selectedTemplate && (
          <div className="text-center">
            <button
              onClick={handleProceedWithTemplate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              Continue with Selected Template
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Next: Upload your resume to generate your portfolio
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;