import axios from 'axios';

// Configure the base URL for API calls
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      console.warn('Resource not found');
    } else if (error.response?.status >= 500) {
      console.error('Server error occurred');
    }
    
    return Promise.reject(error);
  }
);

// User API endpoints
export const userAPI = {
  // Get all users with rankings
  getAllUsers: () => api.get('/users'),
  
  // Get a specific user by ID
  getUser: (id) => api.get(`/users/${id}`),
  
  // Create a new user
  createUser: (userData) => api.post('/users', userData),
  
  // Update user information
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  
  // Delete a user
  deleteUser: (id) => api.delete(`/users/${id}`),
  
  // Claim random points for a user
  claimPoints: (id) => api.post(`/users/${id}/claim`),
  
  // Reset all user points
  resetAllPoints: () => api.post('/users/reset-all'),
};

// History API endpoints
export const historyAPI = {
  // Get all point claim history with pagination
  getHistory: (page = 1, limit = 20) => 
    api.get(`/history?page=${page}&limit=${limit}`),
  
  // Get recent activity
  getRecentActivity: (limit = 10) => 
    api.get(`/history/recent?limit=${limit}`),
  
  // Get history for a specific user
  getUserHistory: (userId, page = 1, limit = 10) => 
    api.get(`/history/user/${userId}?page=${page}&limit=${limit}`),
  
  // Get overall statistics
  getStats: () => api.get('/history/stats'),
  
  // Search history
  searchHistory: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/history/search?${queryString}`);
  },
  
  // Delete a history record
  deleteHistoryRecord: (id) => api.delete(`/history/${id}`),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

// Export default api instance for custom calls
export default api;
