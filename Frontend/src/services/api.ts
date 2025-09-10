// Centralized API configuration using axios
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 30000, // 30 seconds timeout
  withCredentials: true, // Important for CORS with credentials
  headers: {
    'Content-Type': 'application/json',
  },
  // Additional configurations for better error handling
  validateStatus: function (status) {
    // Resolve promises for any status code less than 500
    return status < 500;
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Global error handling - errors will be handled by individual components
    return Promise.reject(error);
  }
);

export default api;

// Utility functions for common patterns
export const apiUtils = {
  // Get template HTML with proper response type
  async getTemplate(templateName: string): Promise<string | null> {
    try {
      const response = await api.get(`/templates/${templateName}.html`, {
        responseType: 'text',
        timeout: 10000,
      });
      return response.status === 200 ? response.data : null;
    } catch {
      return null;
    }
  },

  // Upload with progress tracking - optimized for mobile
  async uploadWithProgress(
    url: string, 
    formData: FormData, 
    headers: Record<string, string> = {},
    onProgress?: (progressEvent: { loaded: number; total?: number }) => void
  ) {
    // Don't set Content-Type for FormData - let browser set it with boundary
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { 'Content-Type': contentType, ...cleanHeaders } = headers;
    
    return api.post(url, formData, {
      headers: {
        ...cleanHeaders, // Include auth headers but not Content-Type
      },
      withCredentials: true, // Ensure credentials are sent
      timeout: 60000, // Longer timeout for file uploads (60 seconds)
      onUploadProgress: onProgress,
      // Additional mobile-friendly settings
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  },
};
