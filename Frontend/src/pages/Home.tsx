import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';


const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
     
      
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-50 rounded-full opacity-30"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-gray-100 rounded-full opacity-30"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-50 rounded-full opacity-30"></div>
      </div>

      {/* Main Screen - Hero + Upload (Flexible fit) */}
      <div className="relative z-10 min-h-screen flex flex-col px-4 sm:px-6 lg:px-8 py-4 overflow-hidden">
        {/* Hero Section - Compact */}
        <div className="text-center flex-shrink-0 max-w-4xl mx-auto pt-4 sm:pt-8 pb-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight px-2">
            <span className="text-gray-900">
              Turn your resume into a live portfolio
            </span>
            <br />
            <span className="text-gray-700">instantly with</span>
            <span className="text-blue-600 font-black"> Crux AI</span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6 px-4">
            <span className="text-green-600 font-semibold">Free beta</span> • 
            <span className="text-blue-600 font-semibold"> AI-powered</span> • 
            <span className="text-indigo-600 font-semibold"> Instant hosting</span>
          </p>
        </div>

        {/* Upload Component - Flexible */}
        <div className="flex-1 flex items-center justify-center min-h-0 px-4">
          <div className="w-full max-w-xl">
            {/* Instead of file upload, show template selection prompt */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                  Ready to Create Your Portfolio?
                </h3>
                
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2">
                  Choose from our professionally designed templates, then upload your resume to get started.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/templates')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors duration-300 shadow-sm text-sm sm:text-base"
                  >
                    Browse Templates
                  </button>
                  
                  {isSignedIn ? (
                    <p className="text-xs sm:text-sm text-gray-500 px-2">
                      Step 1: Choose a template • Step 2: Upload resume • Step 3: Generate portfolio
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-500">
                      <Link to="/signin" className="text-blue-600 hover:underline">Sign in</Link> to get started
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator - Fixed at bottom */}
        <div className="flex-shrink-0 pb-4 flex flex-col items-center">
          <p className="text-gray-500 text-xs mb-1">Learn more</p>
          <div className="animate-bounce">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Features Section - On Scroll */}
      <div className="relative z-10 bg-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Why Choose Crux AI?</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Transform your career with our cutting-edge AI technology that creates professional portfolios in seconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
            <div className="text-center px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">AI-Powered Intelligence</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Advanced AI extracts and organizes your resume data automatically, ensuring nothing important is missed</p>
            </div>
            
            <div className="text-center px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Instant Portfolio Creation</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Transform your resume into a stunning, responsive portfolio website in seconds, not hours</p>
            </div>
            
            <div className="text-center px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Live Hosting & Sharing</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Get a shareable link to your professional portfolio instantly, perfect for job applications and networking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
