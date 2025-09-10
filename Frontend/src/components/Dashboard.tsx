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

  // Log the API base URL being used
  console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-6xl w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Build Beautiful Portfolios in Minutes
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Transform your resume into a stunning, professional portfolio with AI-powered design templates.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => navigate('/signin')}
                  className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg"
                >
                  Sign In
                </button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>✓ No credit card required</span>
                <span>✓ Live in minutes</span>
                <span>✓ Professional templates</span>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-gray-100 rounded"></div>
                    <div className="h-16 bg-gray-100 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstName || "User"}
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your portfolio projects
              </p>
            </div>
            <button
              onClick={() => navigate('/templates')}
              className="px-3 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Create New Portfolio</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Projects</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{projects.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Live Deployments</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {projects.filter(p => p.deployedUrl).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">This Month</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {projects.filter(p => {
                const projectDate = new Date(p.createdAt);
                const now = new Date();
                return projectDate.getMonth() === now.getMonth() && 
                       projectDate.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {projects.length} {projects.length === 1 ? 'project' : 'projects'} total
                </p>
              </div>
              <button
                onClick={refreshProjects}
                disabled={loading}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-gray-600 font-medium">Loading projects...</span>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Projects</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={refreshProjects}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : projects.length > 0 ? (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {project.title || 'Untitled Portfolio'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {getTemplateFromPrompt(project.prompt)}
                          </span>
                          <span className="text-sm text-gray-500">
                            Created {formatDate(project.createdAt)}
                          </span>
                          {project.deployedUrl && (
                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                              Live
                            </span>
                          )}
                        </div>
                        {project.prompt && (
                          <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                            {project.prompt}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {project.deployedUrl && (
                          <a
                            href={project.deployedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            View Live
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                        <button 
                          onClick={() => deleteProject(project.id)} 
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete project"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first portfolio to get started
                </p>
                <button
                  onClick={() => navigate('/templates')}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Portfolio
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
