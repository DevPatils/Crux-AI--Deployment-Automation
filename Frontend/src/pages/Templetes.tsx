import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Navbar from '../components/Navbar';

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
      id: 'classic-elegance',
      name: 'Classic Elegance',
      description: 'Timeless, classic layout suitable for corporate and traditional industries.',
      preview: '/templates/classic-elegance.html',
      features: ['Professional Layout','Experience Timeline','PDF Download','Social Links'],
      category: 'Corporate'
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
      alert('Please sign in to continue with template selection.');
      navigate('/signin');
      return;
    }

    if (!selectedTemplate) {
      alert('Please select a template first.');
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
      const html = await resp.text();
      setPreviewHtml(html);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Preview load error:', err);
      alert('Failed to load template preview.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white max-w-4xl w-full h-[80vh] overflow-auto rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Template Preview</h3>
                <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => { setIsPreviewOpen(false); setPreviewHtml(null); }}>Close</button>
              </div>
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
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