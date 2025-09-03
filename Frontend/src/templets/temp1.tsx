import React, { useState, useEffect } from "react";
import { fetchPortfolioData, uploadResumeAndFetchData, type PortfolioData } from "../services/portfolioService";

interface ResumeProps {
  data?: PortfolioData | null;
}

const Resume: React.FC<ResumeProps> = ({ data: propData }) => {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("hero");
  const [isVisible, setIsVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const portfolioData = propData || await fetchPortfolioData();
        setData(portfolioData);
      } catch (error) {
        console.error('Error loading portfolio data:', error);
      } finally {
        setLoading(false);
        setIsVisible(true);
      }
    };

    loadData();
  }, [propData]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const portfolioData = await uploadResumeAndFetchData(file);
      if (portfolioData) {
        setData(portfolioData);
      } else {
        alert('Failed to process the resume. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Error uploading resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="text-center z-10">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-transparent bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-2 bg-black rounded-full"></div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
            Loading Portfolio
          </h2>
          <p className="text-gray-400 mt-2">Preparing something amazing...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Dynamic background */}
        <div className="absolute inset-0">
          <div 
            className="absolute w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl transition-all duration-300"
            style={{ 
              left: `${mousePosition.x / 10}px`, 
              top: `${mousePosition.y / 10}px` 
            }}
          ></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="text-center text-white max-w-lg mx-auto px-6 z-10">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold mb-6 animate-pulse">
              ⚡
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
            Create Your Portfolio
          </h2>
          <p className="text-gray-300 mb-8 text-lg leading-relaxed">
            Transform your resume into a stunning, professional portfolio website in seconds
          </p>
          
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 hover:border-cyan-400/50 transition-all duration-300">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="resume-upload"
            />
            <label 
              htmlFor="resume-upload"
              className={`block w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 px-8 py-4 rounded-2xl text-white font-semibold cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-2xl ${uploading ? 'opacity-50 cursor-not-allowed scale-100' : ''}`}
            >
              {uploading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Resume...</span>
                </div>
              ) : (
                'Upload Resume & Generate Portfolio'
              )}
            </label>
            <p className="text-gray-400 text-sm mt-4">Supports PDF and DOCX files • Powered by AI</p>
          </div>
        </div>
      </div>
    );
  }

  const { personalInfo, experience, projects, skills, education } = data;

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-cyan-400/5 to-blue-600/5 rounded-full blur-3xl transition-all duration-1000"
          style={{ 
            left: `${mousePosition.x / 20}px`, 
            top: `${mousePosition.y / 20}px` 
          }}
        ></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/5 to-pink-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gradient-to-r from-green-400/5 to-cyan-600/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center text-black font-bold text-lg">
                {personalInfo?.name?.charAt(0) || 'D'}
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                {personalInfo?.name?.split(' ')[0] || 'Portfolio'}
              </span>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {['hero', 'about', 'experience', 'projects', 'skills', 'education', 'contact'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`capitalize text-sm font-medium transition-all duration-300 hover:text-cyan-400 relative group ${
                    activeSection === section ? 'text-cyan-400' : 'text-gray-300'
                  }`}
                >
                  {section}
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-purple-600 transform transition-transform duration-300 ${
                    activeSection === section ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}></span>
                </button>
              ))}
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {personalInfo?.linkedin && (
                <a 
                  href={personalInfo.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-cyan-400/50 hover:bg-cyan-400/10 transition-all duration-300 group"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd"/>
                  </svg>
                </a>
              )}
              {personalInfo?.github && (
                <a 
                  href={`https://${personalInfo.github}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-purple-400/50 hover:bg-purple-400/10 transition-all duration-300 group"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"/>
                  </svg>
                </a>
              )}
              <button 
                onClick={() => {
                  document.getElementById('resume-reupload')?.click();
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 transform hover:scale-105"
              >
                Upload New Resume
              </button>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="resume-reupload"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="min-h-screen flex items-center justify-center relative pt-20 px-6">
        <div className={`text-center z-10 max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
          {/* Profile Avatar */}
          <div className="mb-8 relative">
            <div className="relative inline-block">
              <div className="w-48 h-48 mx-auto bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-6xl font-bold shadow-2xl animate-pulse">
                {personalInfo?.name?.charAt(0) || 'D'}
              </div>
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce delay-200"></div>
              <div className="absolute -bottom-2 -left-6 w-6 h-6 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full animate-bounce delay-500"></div>
              <div className="absolute top-1/2 -left-8 w-4 h-4 bg-gradient-to-r from-pink-400 to-red-500 rounded-full animate-bounce delay-1000"></div>
            </div>
          </div>
          
          {/* Name with Typing Effect */}
          <div className="mb-6 overflow-hidden">
            <h1 className="text-6xl md:text-8xl font-black mb-4 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                {personalInfo?.name || 'Dev Patil'}
              </span>
            </h1>
          </div>
          
          {/* Animated Title */}
          <div className="mb-8 relative">
            <div className="text-xl md:text-3xl text-gray-300 font-light leading-relaxed max-w-4xl mx-auto">
              <span className="relative">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-semibold">
                  {personalInfo?.title || 'AI Integrations and Automations | Web Development (Full Stack)'}
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 blur-lg animate-pulse"></div>
              </span>
            </div>
          </div>
          
          {/* Contact Badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {personalInfo?.email && (
              <div className="flex items-center space-x-2 bg-gray-900/50 border border-gray-700 px-4 py-2 rounded-full backdrop-blur-sm hover:border-cyan-400/50 transition-all duration-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-300 text-sm">{personalInfo.email}</span>
              </div>
            )}
            {personalInfo?.phone && (
              <div className="flex items-center space-x-2 bg-gray-900/50 border border-gray-700 px-4 py-2 rounded-full backdrop-blur-sm hover:border-purple-400/50 transition-all duration-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                <span className="text-gray-300 text-sm">{personalInfo.phone}</span>
              </div>
            )}
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
            {personalInfo?.email && (
              <a 
                href={`mailto:${personalInfo.email}`} 
                className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-4 rounded-2xl text-white font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  <span>Let's Work Together</span>
                </div>
              </a>
            )}
            <button 
              onClick={() => scrollToSection('projects')}
              className="group relative overflow-hidden border-2 border-gray-700 hover:border-cyan-400 px-8 py-4 rounded-2xl text-white font-semibold backdrop-blur-sm transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span>Explore My Work</span>
              </div>
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
                {projects?.length || 0}+
              </div>
              <div className="text-gray-400 text-sm">Projects Built</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
                {experience?.length || 0}+
              </div>
              <div className="text-gray-400 text-sm">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent mb-2">
                {Object.values(skills || {}).flat().length || 0}+
              </div>
              <div className="text-gray-400 text-sm">Technologies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                100%
              </div>
              <div className="text-gray-400 text-sm">Dedication</div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                About Me
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 blur-2xl rounded-3xl"></div>
                <div className="relative bg-gray-900/50 border border-gray-800 rounded-3xl p-8 backdrop-blur-xl">
                  <p className="text-xl text-gray-300 leading-relaxed mb-6">
                    {personalInfo?.title?.includes('AI') 
                      ? "I'm passionate about creating intelligent solutions that bridge the gap between artificial intelligence and practical applications. I specialize in building scalable web applications with cutting-edge AI integrations that solve real-world problems."
                      : "I'm a passionate developer with expertise in creating innovative solutions that bridge the gap between design and functionality. I love building applications that make a difference."
                    }
                  </p>
                  <p className="text-lg text-gray-400 leading-relaxed">
                    From concept to deployment, I craft digital experiences that are not just functional, but delightful to use. Every line of code is written with purpose, every design decision made with the user in mind.
                  </p>
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="space-y-4">
                {personalInfo?.email && (
                  <div className="flex items-center space-x-4 group">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Email</p>
                      <p className="text-white font-medium">{personalInfo.email}</p>
                    </div>
                  </div>
                )}
                {personalInfo?.phone && (
                  <div className="flex items-center space-x-4 group">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Phone</p>
                      <p className="text-white font-medium">{personalInfo.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Content - Interactive Cards */}
            <div className="grid grid-cols-2 gap-6">
              {/* Innovation Card */}
              <div className="group relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/20 to-blue-600/20 blur-xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-gray-900/50 border border-gray-800 rounded-3xl p-6 backdrop-blur-xl hover:border-cyan-400/50 transition-all duration-300 text-center">
                  <div className="text-5xl mb-4">🚀</div>
                  <h3 className="text-xl font-bold mb-2 text-white">Innovation</h3>
                  <p className="text-gray-400 text-sm">Always exploring cutting-edge technologies</p>
                </div>
              </div>
              
              {/* Quality Card */}
              <div className="group relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-400/20 to-pink-600/20 blur-xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-gray-900/50 border border-gray-800 rounded-3xl p-6 backdrop-blur-xl hover:border-purple-400/50 transition-all duration-300 text-center">
                  <div className="text-5xl mb-4">�</div>
                  <h3 className="text-xl font-bold mb-2 text-white">Quality</h3>
                  <p className="text-gray-400 text-sm">Crafting pixel-perfect experiences</p>
                </div>
              </div>
              
              {/* Performance Card */}
              <div className="group relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-green-400/20 to-cyan-600/20 blur-xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-gray-900/50 border border-gray-800 rounded-3xl p-6 backdrop-blur-xl hover:border-green-400/50 transition-all duration-300 text-center">
                  <div className="text-5xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold mb-2 text-white">Performance</h3>
                  <p className="text-gray-400 text-sm">Optimized for speed and efficiency</p>
                </div>
              </div>
              
              {/* Collaboration Card */}
              <div className="group relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/20 to-orange-600/20 blur-xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-gray-900/50 border border-gray-800 rounded-3xl p-6 backdrop-blur-xl hover:border-yellow-400/50 transition-all duration-300 text-center">
                  <div className="text-5xl mb-4">🤝</div>
                  <h3 className="text-xl font-bold mb-2 text-white">Collaboration</h3>
                  <p className="text-gray-400 text-sm">Working together to achieve excellence</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent">
                Experience
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-green-500 mx-auto rounded-full"></div>
          </div>
          
          {experience && experience.length > 0 ? (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-0.5 h-full w-1 bg-gradient-to-b from-blue-400 via-purple-500 to-green-400 hidden lg:block"></div>
              
              <div className="space-y-12">
                {experience.map((exp, index) => (
                  <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                    {/* Timeline Node */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full border-4 border-gray-900 z-20 hidden lg:block">
                      <div className="absolute inset-1 bg-white rounded-full animate-pulse"></div>
                    </div>
                    
                    {/* Content */}
                    <div className={`w-full lg:w-1/2 ${index % 2 === 0 ? 'lg:pr-12' : 'lg:pl-12'}`}>
                      <div className="group relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-purple-500/20 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative bg-gray-900/60 border border-gray-800 rounded-3xl p-8 backdrop-blur-xl hover:border-blue-400/50 transition-all duration-300">
                          <div className="flex items-start justify-between mb-6">
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-2">{exp.position || exp.role}</h3>
                              <p className="text-xl text-blue-400 font-semibold mb-2">{exp.company}</p>
                              <p className="text-gray-400 text-sm font-medium">{exp.duration}</p>
                            </div>
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm8 7V8a1 1 0 10-2 0v3H8a1 1 0 100 2h2v3a1 1 0 102 0v-3h2a1 1 0 100-2h-2z"/>
                              </svg>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            {exp.description && (
                              <p className="text-gray-300 leading-relaxed">{exp.description}</p>
                            )}
                            
                            {exp.responsibilities && exp.responsibilities.length > 0 && (
                              <div>
                                <h4 className="text-lg font-semibold text-white mb-3">Key Achievements</h4>
                                <ul className="space-y-2">
                                  {exp.responsibilities.map((resp, idx) => (
                                    <li key={idx} className="flex items-start space-x-3">
                                      <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                      <span className="text-gray-300 text-sm leading-relaxed">{resp}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {exp.technologies && exp.technologies.length > 0 && (
                              <div className="pt-4 border-t border-gray-700">
                                <div className="flex flex-wrap gap-2">
                                  {exp.technologies.map((tech, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-medium backdrop-blur-sm">
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-purple-500/20 blur-2xl rounded-3xl"></div>
                <div className="relative bg-gray-900/60 border border-gray-800 rounded-3xl p-12 backdrop-blur-xl">
                  <div className="text-6xl mb-6">💼</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Ready for New Opportunities</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Passionate about creating innovative solutions and ready to bring fresh ideas to your team.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Experience */}
      <section id="experience" className="py-20 px-6 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold mb-16 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Experience
          </h2>
          <div className="space-y-12">
            {experience?.map((exp, i: number) => (
              <div key={i} className="group relative">
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 rounded-3xl backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 border border-white/10">
                  <div className="absolute -left-4 top-8 w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{exp.role}</h3>
                      <p className="text-blue-400 text-lg font-semibold">{exp.company}</p>
                    </div>
                    <span className="text-gray-400 bg-gray-800/50 px-4 py-2 rounded-full text-sm">
                      {exp.duration}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {exp.achievements?.map((ach: string, j: number) => (
                      <div key={j} className="flex items-start space-x-3">
                        <span className="text-blue-400 mt-1">▸</span>
                        <p className="text-gray-300 leading-relaxed">{ach}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Featured Projects
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects?.map((proj, i: number) => (
              <div key={i} className="group relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-400/20 to-pink-500/20 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-gray-900/60 border border-gray-800 rounded-3xl overflow-hidden backdrop-blur-xl hover:border-purple-400/50 transition-all duration-300 transform hover:scale-105">
                  <div className="p-8">
                    {/* Project Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-2xl">
                        🚀
                      </div>
                      <div className="flex space-x-3">
                        {proj.links?.demo && (
                          <a 
                            href={proj.links.demo} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-10 h-10 bg-gray-800 hover:bg-purple-600 rounded-xl flex items-center justify-center transition-colors duration-300 group"
                          >
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                        {proj.links?.github && (
                          <a 
                            href={proj.links.github} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-10 h-10 bg-gray-800 hover:bg-purple-600 rounded-xl flex items-center justify-center transition-colors duration-300 group"
                          >
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Project Content */}
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-white mb-2">{proj.name}</h3>
                      {proj.duration && (
                        <p className="text-purple-400 text-sm font-medium">{proj.duration}</p>
                      )}
                      <p className="text-gray-300 leading-relaxed">{proj.description}</p>
                      
                      {/* Technologies */}
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className="pt-4 border-t border-gray-700">
                          <div className="flex flex-wrap gap-2">
                            {proj.technologies.map((tech: string, techIndex: number) => (
                              <span key={techIndex} className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-full text-purple-300 text-xs font-medium backdrop-blur-sm">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            )) || (
              // Default projects if none available
              Array.from({length: 3}).map((_, i) => (
                <div key={i} className="group relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-400/20 to-pink-500/20 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative bg-gray-900/60 border border-gray-800 rounded-3xl overflow-hidden backdrop-blur-xl hover:border-purple-400/50 transition-all duration-300">
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">
                        💡
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4">Project Coming Soon</h3>
                      <p className="text-gray-400">Exciting projects in development</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                Skills & Technologies
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-cyan-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(skills || {}).map(([category, items]: [string, string[]]) => (
              <div key={category} className="group relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400/20 to-cyan-500/20 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-gray-900/60 border border-gray-800 rounded-3xl p-8 backdrop-blur-xl hover:border-emerald-400/50 transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center mr-4">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-white capitalize">{category}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {items?.map((skill: string, i: number) => (
                      <div key={i} className="group/skill relative overflow-hidden">
                        <div className="flex items-center justify-between bg-gray-800/50 px-4 py-3 rounded-xl hover:bg-gray-800/70 transition-all duration-300">
                          <span className="text-gray-300 font-medium">{skill}</span>
                          <div className="flex space-x-1">
                            {[...Array(5)].map((_, starIndex) => (
                              <div 
                                key={starIndex} 
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                  starIndex < 4 
                                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-500' 
                                    : 'bg-gray-600'
                                }`}
                                style={{
                                  animationDelay: `${starIndex * 100}ms`
                                }}
                              ></div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Progress bar effect */}
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-500 w-0 group-hover/skill:w-4/5 transition-all duration-700"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )) || (
              // Default skills if none available
              ['Frontend', 'Backend', 'Tools'].map((category) => (
                <div key={category} className="group relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400/20 to-cyan-500/20 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative bg-gray-900/60 border border-gray-800 rounded-3xl p-8 backdrop-blur-xl hover:border-emerald-400/50 transition-all duration-300">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center mr-4">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                      <h3 className="text-2xl font-bold text-white">{category}</h3>
                    </div>
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">⚡</div>
                      <p className="text-gray-400">Skills coming soon</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section id="education" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Education
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="space-y-8">
            {education?.map((edu, i: number) => (
              <div key={i} className="group relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-400/20 to-orange-500/20 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-gray-900/60 border border-gray-800 rounded-3xl p-8 backdrop-blur-xl hover:border-amber-400/50 transition-all duration-300">
                  <div className="grid md:grid-cols-4 gap-6 items-center">
                    {/* Icon */}
                    <div className="flex justify-center md:justify-start">
                      <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center text-3xl shadow-2xl">
                        🎓
                      </div>
                    </div>
                    
                    {/* Education Details */}
                    <div className="md:col-span-2 text-center md:text-left">
                      <h3 className="text-2xl font-bold text-white mb-2">{edu.degree}</h3>
                      <p className="text-amber-400 text-lg font-semibold mb-1">{edu.institution}</p>
                    </div>
                    
                    {/* Duration & GPA */}
                    <div className="text-center md:text-right space-y-2">
                      <p className="text-gray-300 font-medium">{edu.duration}</p>
                      {edu.gpa && (
                        <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-400/30 px-3 py-1 rounded-full">
                          <span className="text-amber-300 text-sm font-medium">GPA: {edu.gpa}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-20">
                <div className="relative inline-block">
                  <div className="absolute -inset-4 bg-gradient-to-r from-amber-400/20 to-orange-500/20 blur-2xl rounded-3xl"></div>
                  <div className="relative bg-gray-900/60 border border-gray-800 rounded-3xl p-12 backdrop-blur-xl">
                    <div className="text-6xl mb-6">🎓</div>
                    <h3 className="text-2xl font-bold text-white mb-4">Continuous Learning</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Always expanding knowledge through formal education and self-directed learning.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 px-6 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-pink-400 to-red-500 bg-clip-text text-transparent">
                Let's Work Together
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-400 to-red-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-r from-pink-400/20 to-red-500/20 blur-3xl rounded-3xl"></div>
            <div className="relative bg-gray-900/60 border border-gray-800 rounded-3xl p-12 backdrop-blur-xl">
              <p className="text-2xl text-gray-300 leading-relaxed mb-12 max-w-3xl mx-auto">
                Ready to bring your ideas to life? Let's collaborate and create something amazing together.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Contact Info */}
                <div className="space-y-6">
                  {personalInfo?.email && (
                    <div className="group flex items-center justify-center md:justify-start space-x-4 p-6 bg-gray-800/50 rounded-2xl hover:bg-gray-800/70 transition-all duration-300">
                      <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-gray-400 text-sm">Email</p>
                        <p className="text-white font-semibold text-lg">{personalInfo.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {personalInfo?.phone && (
                    <div className="group flex items-center justify-center md:justify-start space-x-4 p-6 bg-gray-800/50 rounded-2xl hover:bg-gray-800/70 transition-all duration-300">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-gray-400 text-sm">Phone</p>
                        <p className="text-white font-semibold text-lg">{personalInfo.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Social Links */}
                <div className="flex flex-col justify-center space-y-4">
                  <h3 className="text-xl font-bold text-white mb-4">Connect With Me</h3>
                  <div className="flex justify-center md:justify-start space-x-4">
                    <a href="#" className="group w-14 h-14 bg-gray-800 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    </a>
                    <a href="#" className="group w-14 h-14 bg-gray-800 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-800 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                    <a href="#" className="group w-14 h-14 bg-gray-800 hover:bg-gradient-to-r hover:from-gray-700 hover:to-black rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                {personalInfo?.email && (
                  <a 
                    href={`mailto:${personalInfo.email}`} 
                    className="group relative overflow-hidden bg-gradient-to-r from-pink-500 to-red-600 px-8 py-4 rounded-2xl font-bold text-white transform hover:scale-105 transition-all duration-300 shadow-2xl"
                  >
                    <span className="relative z-10">Send Email</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-red-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </a>
                )}
                <a 
                  href="#projects" 
                  className="group relative overflow-hidden bg-transparent border-2 border-gray-600 hover:border-pink-400 px-8 py-4 rounded-2xl font-bold text-gray-300 hover:text-white transform hover:scale-105 transition-all duration-300"
                >
                  <span className="relative z-10">View Projects</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-red-600/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">
            © 2025 {personalInfo?.name || 'Portfolio'}. Built with React & Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Resume;
