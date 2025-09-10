import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useToast } from '../components/useToast';
import api from '../services/api';
import FileUpload from '../components/FileUpload';

const CreatePortfolio: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  // ...existing code...
  const [projectId, setProjectId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showProjectIdInput, setShowProjectIdInput] = useState(false);
  const [compiledHtmlPreview, setCompiledHtmlPreview] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isReadyToDeploy, setIsReadyToDeploy] = useState(false);
  const [deploymentData, setDeploymentData] = useState<{
    compiledHtml: string;
    projectName: string;
    token: string;
  } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn, getToken } = useAuth();
  const toast = useToast();

  useEffect(() => {
    // Get template from URL search params, navigation state, or localStorage
    const urlParams = new URLSearchParams(location.search);
    const templateFromUrl = urlParams.get('template');
    const templateFromState = location.state?.templateId;
    const templateFromStorage = localStorage.getItem('selectedTemplate');
    
    if (templateFromUrl) {
      setSelectedTemplate(templateFromUrl);
  try { localStorage.setItem('selectedTemplate', templateFromUrl); } catch (e) { console.warn('localStorage write failed', e); }
    } else if (templateFromState) {
      setSelectedTemplate(templateFromState);
  try { localStorage.setItem('selectedTemplate', templateFromState); } catch (e) { console.warn('localStorage write failed', e); }
    } else if (templateFromStorage) {
      setSelectedTemplate(templateFromStorage);
    } else {
      // No template selected: default to modern-professional and preload its HTML from public folder
      const defaultTemplate = 'modern-professional';
      setSelectedTemplate(defaultTemplate);
      try { localStorage.setItem('selectedTemplate', defaultTemplate); } catch (e) { console.warn('localStorage write failed', e); }
      (async () => {
        try {
          const resp = await fetch(`/templates/${defaultTemplate}.html`);
          if (resp.ok) {
            const html = await resp.text();
            try { localStorage.setItem('selectedTemplateHtml', html); } catch {
                console.log("catch");
            }
          }
        } catch (err) {
          console.warn('Failed to fetch default template HTML:', err);
        }
      })();
    }
  }, [location.search, location.state, navigate]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setShowProjectIdInput(true);
    
    // Scroll to project ID input after file selection
    setTimeout(() => {
      const projectIdSection = document.getElementById('project-id-section');
      if (projectIdSection) {
        projectIdSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  const handleAvatarSelect = (avatar: File | null) => {
    setSelectedAvatar(avatar);
  };

  const handleGeneratePortfolio = async () => {
    if (!selectedFile) {
      toast.push('Please select a resume file first.', { type: 'error' });
      return;
    }

    await handleUpload(selectedFile, selectedAvatar || undefined);
  };

  const handleUpload = async (file: File, avatar?: File) => {
    if (!isSignedIn) {
      toast.push('Please sign in to upload your resume.', { type: 'warning' });
      return;
    }

    if (!selectedTemplate) {
      toast.push('No template selected. Please go back and select a template.', { type: 'warning' });
      navigate('/templates');
      return;
    }

    // Validate project ID - now mandatory
    if (!projectId.trim()) {
      toast.push('Project ID is required. Please enter a project name.', { type: 'error' });
      const projectIdSection = document.getElementById('project-id-section');
      if (projectIdSection) {
        projectIdSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus the input field
        setTimeout(() => {
          const input = document.getElementById('projectId') as HTMLInputElement;
          if (input) input.focus();
        }, 300);
      }
      return;
    }

    const sanitizedId = projectId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (sanitizedId.length < 3) {
      toast.push('Project ID must be at least 3 characters long.', { type: 'error' });
      return;
    }
    if (sanitizedId !== projectId.trim().toLowerCase()) {
      // Auto-apply sanitized ID and inform the user via toast (avoids native confirm popup)
      setProjectId(sanitizedId);
      toast.push(`Project ID sanitized to: ${sanitizedId}`, { type: 'info', duration: 5000 });
    }

    setIsUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('templateId', selectedTemplate);

      // Add avatar if provided (only for modern-professional template)
      if (avatar && selectedTemplate === 'modern-professional') {
        formData.append('avatar', avatar);
      }

      // Prefer templateHtml provided via navigation state or localStorage (Templates.tsx stores selectedTemplateHtml)
      const templateFromState = location.state?.templateHtml;
      const templateFromStorage = localStorage.getItem('selectedTemplateHtml');
      if (templateFromState && typeof templateFromState === 'string') {
        formData.append('templateHtml', templateFromState);
      } else if (templateFromStorage) {
        formData.append('templateHtml', templateFromStorage);
      } else {
        // final fallback: fetch template HTML from the frontend public folder
        try {
          const tplResp = await fetch(`/templates/${selectedTemplate}.html`);
            if (tplResp.ok) {
            const tplHtml = await tplResp.text();
            formData.append('templateHtml', tplHtml);
            try { localStorage.setItem('selectedTemplateHtml', tplHtml); } catch { /* ignore */ }
          } else {
            console.warn('Template HTML not found in frontend public folder, backend will fallback to server templates');
          }
        } catch (err) {
          console.warn('Failed to fetch template HTML from frontend:', err);
        }
      }
      
      // Generate project name - project ID is now mandatory
      const projectName = projectId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      formData.append('projectName', projectName);

      // Step 1: send resume + template to backend to extract and compile HTML
      const uploadResp = await api.post('/generate/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!uploadResp.data || !uploadResp.data.success) {
        throw new Error(uploadResp.data?.error || 'Failed to extract and compile resume');
      }

      const compiledHtml = uploadResp.data.html;

      // Basic validation: compiled HTML should be non-empty and contain <html or <body or significant content
      if (!compiledHtml || compiledHtml.trim().length < 50 || !/(<html|<body|<div|<section|<header)/i.test(compiledHtml)) {
        throw new Error('Compiled HTML appears empty or invalid. Aborting deployment.');
      }

      // Store deployment data and show deploy button
      const finalProjectName = projectId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const authToken = await getToken();
      
      setDeploymentData({
        compiledHtml,
        projectName: finalProjectName,
        token: authToken || ''
      });
      setIsReadyToDeploy(true);

      // Also show preview
      setCompiledHtmlPreview(compiledHtml || '');
      setIsPreviewOpen(true);

      toast.push('Portfolio generated successfully! You can now preview and deploy it.', { type: 'success' });

      // Wait for user confirmation via modal (polling state change) - simplified: user will click confirm which calls deployConfirmed below
      // The modal's Confirm button triggers deployConfirmed(compiledHtml, projectName, token)
  } catch (error: unknown) {
    console.error('Portfolio generation error:', error);
    // Prefer backend-provided message when available
    let errorMessage = 'Portfolio generation failed. Please try again.';
    if (typeof error === 'object' && error !== null) {
      const errObj = error as { response?: { data?: { error?: string; details?: string } }; message?: string };
      const backendMsg = errObj?.response?.data?.error || errObj?.response?.data?.details || errObj?.message;
      if (backendMsg) {
        errorMessage = backendMsg;
      }
    }
  toast.push(errorMessage, { type: 'error' });
  } finally {
    setIsUploading(false);
  }
  };

  const deployConfirmed = async (compiledHtml: string, projectName: string, token: string) => {
    setIsPreviewOpen(false);
    setIsUploading(true);
    try {
      const deployResp = await api.post('/generate/deploy', {
        html: compiledHtml,
        projectName,
        templateId: selectedTemplate,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (deployResp.data && deployResp.data.success) {
        // Clear the stored template and reset states
        localStorage.removeItem('selectedTemplate');
        setIsReadyToDeploy(false);
        setDeploymentData(null);
        setCompiledHtmlPreview('');

        const deploymentUrl = deployResp.data.url || deployResp.data.deployment?.url || deployResp.data.deploymentUrl;
        const originalName = deployResp.data.originalName || projectName;
        const finalName = deployResp.data.finalName || projectName;
        
        const message = originalName !== finalName 
          ? `Portfolio created and deployed successfully!\n\nOriginal name: ${originalName}\nFinal URL: ${deploymentUrl}\n\n(crux-ai suffix added for branding)\n\nRedirecting to dashboard...`
          : `Portfolio created and deployed successfully!\n\nYour portfolio is live at:\n${deploymentUrl}\n\nRedirecting to dashboard...`;
          
        toast.push(message, { type: 'success', duration: 8000 });

        navigate('/dashboard', { 
          state: { 
            deploymentUrl,
            projectName: finalName,
            originalName,
            templateId: selectedTemplate,
            deploymentId: deployResp.data.deploymentId || deployResp.data.deployment?.deploymentId
          } 
        });
      } else {
        throw new Error(deployResp.data?.error || 'Deployment failed');
      }
    } catch (err) {
      console.error('Deployment error:', err);
      toast.push('Deployment failed. See console for details.', { type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const getTemplateName = (templateId: string | null) => {
    switch (templateId) {
      case 'modern-professional':
        return 'Modern Professional';
      case 'classic-elegance':
        return 'Classic Elegance';
      default:
        return 'Selected Template';
    }
  }; 

  if (!selectedTemplate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
   
      
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-48 h-48 sm:w-72 sm:h-72 bg-blue-50 rounded-full opacity-30"></div>
        <div className="absolute -top-4 -right-4 w-48 h-48 sm:w-72 sm:h-72 bg-gray-100 rounded-full opacity-30"></div>
        <div className="absolute -bottom-8 left-10 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-indigo-50 rounded-full opacity-30"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header with Template Info */}
        <div className="text-center mb-6 sm:mb-8">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-500 mb-4">
            <button
              onClick={() => navigate('/templates')}
              className="hover:text-blue-600 transition-colors duration-300"
            >
              Templates
            </button>
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-900 font-medium">Create Portfolio</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
            Create Your Portfolio
          </h1>
          <div className="inline-flex items-center bg-blue-100 text-blue-700 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Template: {getTemplateName(selectedTemplate)}
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Create Your Portfolio
            </h2>
            <p className="text-gray-600">
              Upload your resume in PDF format and our AI will transform it into a stunning portfolio using your selected template.
            </p>
          </div>

          <FileUpload 
            onFileSelect={handleFileSelect}
            onAvatarSelect={handleAvatarSelect}
            // isUploading={isUploading}
            isAuthenticated={isSignedIn}
            showAvatarUpload={selectedTemplate === 'modern-professional'}
            templateName={getTemplateName(selectedTemplate)}
          />

          {/* Project ID Input - Shows after file selection */}
          {showProjectIdInput && (
            <div id="project-id-section" className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">Set Your Project Name</h3>
                  <p className="text-sm text-blue-600">Choose a unique name for your portfolio project</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
                  Project ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="projectId"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="Enter your project name (e.g., my-awesome-portfolio)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {projectId.trim() ? (
                    <>Your portfolio will be deployed as: <span className="font-mono text-blue-600">{projectId.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-crux-ai</span> <span className="text-gray-400">(crux-ai suffix added for branding)</span></>
                  ) : (
                    'Required: Enter a unique project name (minimum 3 characters)'
                  )}
                </p>
              </div>

              {/* Generate Portfolio Button */}
              <div className="pt-4 border-t border-blue-200">
                <button
                  onClick={handleGeneratePortfolio}
                  disabled={isUploading || !projectId.trim() || !selectedFile}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating Portfolio...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Portfolio
                    </>
                  )}
                </button>
                <p className="mt-2 text-xs text-blue-600 text-center">
                  Your portfolio will be generated and ready for preview
                </p>
              </div>
            </div>
          )}

          {/* Deploy Actions - Show after successful upload */}
          {isReadyToDeploy && deploymentData && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">Portfolio Ready!</h3>
                    <p className="text-sm text-green-600">Your portfolio has been generated and is ready to deploy.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsPreviewOpen(true)}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors duration-200"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => deployConfirmed(deploymentData.compiledHtml, deploymentData.projectName, deploymentData.token)}
                    disabled={isUploading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deploying...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Deploy Portfolio
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Compiled HTML Preview Modal */}
          {isPreviewOpen && compiledHtmlPreview && (
            <div className="fixed inset-0 z-50 bg-white overflow-hidden">
              {/* Full screen header bar */}
              <div className="flex items-center justify-between bg-gray-100 border-b border-gray-300 px-2 sm:px-4 py-3 h-14 sm:h-16">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 ml-2 sm:ml-4 font-medium">Generated Portfolio Preview</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    className="px-4 py-2 sm:px-6 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm sm:text-base font-medium transition-colors duration-200 flex items-center gap-2"
                    onClick={() => { setIsPreviewOpen(false); }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                  <button 
                    className="px-4 py-2 sm:px-6 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm sm:text-base font-medium transition-colors duration-200 flex items-center gap-2"
                    disabled={isUploading}
                    onClick={async () => {
                        if (!compiledHtmlPreview) { toast.push('No compiled HTML ready to deploy', { type: 'error' }); return; }
                        const token = await getToken();
                        const projectName = projectId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
                        deployConfirmed(compiledHtmlPreview, projectName, token || '');
                      }}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deploying...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Deploy Portfolio
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Full screen content */}
              <div className="w-full h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-auto bg-white">
                <iframe
                  srcDoc={compiledHtmlPreview}
                  className="w-full h-full border-0"
                  style={{
                    minHeight: '100%',
                    backgroundColor: 'white'
                  }}
                  title="Generated Portfolio Preview"
                  sandbox="allow-same-origin allow-scripts"
                />
              </div>

              {/* Bottom action bar for better visibility */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Portfolio generated successfully
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200"
                    onClick={() => { setIsPreviewOpen(false); }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    disabled={isUploading}
                    onClick={async () => {
                        if (!compiledHtmlPreview) { toast.push('No compiled HTML ready to deploy', { type: 'error' }); return; }
                        const token = await getToken();
                        const projectName = projectId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
                        deployConfirmed(compiledHtmlPreview, projectName, token || '');
                      }}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deploying...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Deploy Portfolio
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Process Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Template Selected</h3>
            <p className="text-xs sm:text-sm text-gray-600">You've chosen the perfect template</p>
          </div>

          <div className={`text-center ${selectedFile ? 'opacity-100' : 'opacity-50'}`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              selectedFile ? 'bg-green-600' : 'bg-gray-300'
            }`}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Upload Resume</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {selectedFile ? 'Resume uploaded successfully' : 'Upload your PDF resume'}
            </p>
          </div>

          <div className={`text-center ${projectId.trim() ? 'opacity-100' : showProjectIdInput ? 'opacity-100' : 'opacity-50'}`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              projectId.trim() ? 'bg-green-600' : showProjectIdInput ? 'bg-blue-600' : 'bg-gray-300'
            }`}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Project ID</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {projectId.trim() ? 'Project ID set' : showProjectIdInput ? 'Enter project name (required)' : 'Set project name'}
            </p>
          </div>
          
          <div className={`text-center ${isReadyToDeploy ? 'opacity-100' : isUploading ? 'opacity-100' : 'opacity-50'}`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isReadyToDeploy ? 'bg-green-600' : isUploading ? 'bg-blue-600' : 'bg-gray-300'
            }`}>
              {isUploading ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isReadyToDeploy ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Generate & Deploy</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {isReadyToDeploy ? 'Ready to deploy!' : isUploading ? 'Creating your portfolio...' : 'AI-powered portfolio generation'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePortfolio;