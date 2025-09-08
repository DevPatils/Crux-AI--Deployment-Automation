import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from './useToast';

interface Project {
  id: number;
  title: string;
  prompt: string;
  contentJSON: Record<string, unknown>;
  deployedUrl?: string;
  userId: number;
  createdAt: string;
}

export default function Dashboard() {
  const { getToken } = useAuth();
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const refreshProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await api.get("/vercel/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        const data: Project[] = response.data;
        // sort by createdAt descending (newest first)
        const sorted = data.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProjects(sorted);
        setError(null);
      } else {
        throw new Error("Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setError("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const syncUserAndFetchProjects = async () => {
      if (!user) return;

      try {
        const token = await getToken();
        
        // First sync user
        await api.post("/users/sync", 
          { email: user.emailAddresses[0].emailAddress },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Then fetch projects
        const response = await api.get("/vercel/projects", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200) {
          const data: Project[] = response.data;
          // sort by createdAt descending (newest first)
          const sorted = data.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setProjects(sorted);
          setError(null);
        } else {
          throw new Error("Failed to fetch projects");
        }
      } catch (error) {
        console.error("Error syncing user or fetching projects:", error);
        setError("Failed to sync user data or fetch projects");
      } finally {
        setLoading(false);
      }
    };

    syncUserAndFetchProjects();
  }, [user, getToken]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deleteProject = async (projectId: number) => {
    if (!confirm('Delete this project and its Vercel deployment? This cannot be undone.')) return;
    try {
      const token = await getToken();
      const resp = await api.delete(`/vercel/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data && resp.data.success) {
        toast.push('Project deleted successfully', { type: 'success' });
        // refresh the list
        refreshProjects();
      } else {
        throw new Error(resp.data?.error || 'Deletion failed');
      }
    } catch (err) {
      console.error('Deletion error:', err);
      toast.push('Failed to delete project. See console for details.', { type: 'error' });
    }
  };

  const getTemplateFromPrompt = (prompt: string) => {
    if (prompt.includes('modern-professional')) return 'Modern Professional';
    if (prompt.includes('classic-elegance')) return 'Classic Elegance';
    return 'Portfolio';
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="w-full max-w-6xl px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-8 shadow-lg">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                  Welcome to CRUX AI — your portfolio companion
                </h1>
                <p className="text-gray-600 text-lg mb-6">
                  Create, manage, and deploy beautiful portfolios in minutes. To access your dashboard and saved projects, please sign up or sign in.
                </p>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                  <button
                    onClick={() => navigate('/signup')}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold shadow-md"
                  >
                    Create an account
                  </button>

                  <button
                    onClick={() => navigate('/signin')}
                    className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                  >
                    Sign in
                  </button>

                  <button
                    onClick={() => navigate('/templates')}
                    className="w-full sm:w-auto px-4 py-3 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium"
                  >
                    Explore templates
                  </button>
                </div>

                <p className="text-sm text-gray-500 mt-6">No credit card required • Improve your online presence instantly</p>
              </div>
            </div>

            <div className="order-1 lg:order-2 flex items-center justify-center">
              <div className="w-full max-w-md">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-xl border border-gray-100">
                  {/* Decorative illustration */}
                  <svg viewBox="0 0 600 400" className="w-full h-64" xmlns="http://www.w3.org/2000/svg" fill="none">
                    <rect x="0" y="0" width="600" height="400" rx="24" fill="#eef2ff" />
                    <g transform="translate(40,30)">
                      <rect x="0" y="0" width="220" height="120" rx="12" fill="#fff" stroke="#e6e9f2" />
                      <rect x="12" y="16" width="60" height="12" rx="6" fill="#c7d2fe" />
                      <rect x="12" y="40" width="180" height="10" rx="6" fill="#e9eefb" />
                      <rect x="12" y="58" width="140" height="10" rx="6" fill="#e9eefb" />

                      <rect x="260" y="10" width="260" height="160" rx="10" fill="#fff" stroke="#e6e9f2" />
                      <circle cx="340" cy="70" r="28" fill="#c7d2fe" />
                      <rect x="382" y="46" width="110" height="12" rx="6" fill="#e9eefb" />
                      <rect x="382" y="70" width="80" height="10" rx="6" fill="#e9eefb" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-8 gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user?.firstName || "User"}!
                </h1>
                <p className="text-gray-600 mt-1 text-lg">
                  Manage and showcase your portfolio projects
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/templates')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create New Portfolio</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow p-6 md:p-8 border border-gray-200/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center">
              <div className="p-4 bg-blue-500 rounded-2xl shadow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Projects</p>
                <p className="text-4xl font-bold text-gray-900 mt-1">{projects.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow p-6 md:p-8 border border-gray-200/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center">
              <div className="p-4 bg-green-500 rounded-2xl shadow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l5 5L20 7" />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Live Deployments</p>
                <p className="text-4xl font-bold text-gray-900 mt-1">
                  {projects.filter(p => p.deployedUrl).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow p-6 md:p-8 border border-gray-200/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center">
              <div className="p-4 bg-purple-500 rounded-2xl shadow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">This Month</p>
                <p className="text-4xl font-bold text-gray-900 mt-1">
                  {projects.filter(p => {
                    const projectDate = new Date(p.createdAt);
                    const now = new Date();
                    return projectDate.getMonth() === now.getMonth() && 
                           projectDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50">
      <div className="px-4 sm:px-8 py-6 border-b border-gray-200/50">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Portfolio Projects</h2>
                <p className="text-gray-600 mt-1">Manage and monitor your deployed portfolios</p>
              </div>
              <button
                onClick={refreshProjects}
                disabled={loading}
        className="px-4 py-2 text-sm bg-gray-100/70 hover:bg-gray-200/70 rounded-xl transition-all duration-200 disabled:opacity-50 backdrop-blur-sm border border-gray-200/50 font-medium"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-lg text-gray-600 font-medium">Loading your projects...</span>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Error Loading Projects</h3>
                <p className="text-gray-600 mb-6 text-lg">{error}</p>
                <button
                  onClick={refreshProjects}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Try Again
                </button>
              </div>
            ) : projects.length > 0 ? (
              <div className="grid gap-8">
                {projects.map((project) => (
                    <div key={project.id} className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 sm:p-8 hover:shadow-lg transition-all duration-300">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          {project.title}
                        </h3>
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <span className="flex items-center bg-gray-100/70 px-3 py-1 rounded-xl">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {getTemplateFromPrompt(project.prompt)}
                          </span>
                          <span className="flex items-center bg-gray-100/70 px-3 py-1 rounded-xl">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDate(project.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                        {project.deployedUrl ? (
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Live
                            </span>
                            <a
                              href={project.deployedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow flex items-center space-x-2 font-medium"
                            >
                              <span>View Live</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            Draft
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-base mb-4">
                      {project.prompt}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-200/50">
                      <span className="text-sm text-gray-500 font-medium mb-3 sm:mb-0">
                        Project ID: {project.id}
                      </span>
                      <div className="flex space-x-3">
                        <button className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-2 hover:bg-blue-50 rounded-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => deleteProject(project.id)} 
                          className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-2 hover:bg-red-50 rounded-lg"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No projects yet</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Create your first portfolio to get started on your journey
                </p>
                <button
                  onClick={() => navigate('/templates')}
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-3 mx-auto font-medium text-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Your First Portfolio</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
