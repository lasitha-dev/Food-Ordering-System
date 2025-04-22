import axios from 'axios';

// Create Axios instance with relative base URL to use React's setupProxy.js
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add auth token to all requests
api.interceptors.request.use(
  (config) => {
    // Check both token storage mechanisms
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request:', {
        method: config.method.toUpperCase(),
        url: config.url,
        data: config.data ? JSON.stringify(config.data).substring(0, 100) + '...' : 'No data'
      });
    } else {
      console.warn('No auth token found for API request to:', config.url);
      
      // For debugging: Check all localStorage content
      try {
        const localStorageKeys = Object.keys(localStorage);
        console.log('All localStorage keys:', localStorageKeys);
      } catch (e) {
        console.error('Error reading localStorage:', e);
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data ? 'Success' : 'No data'
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log all API errors for debugging
    console.error('API error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('URL:', originalRequest.url);
      console.error('Method:', originalRequest.method);
      console.error('Headers:', JSON.stringify(originalRequest.headers));
      
      if (originalRequest.data) {
        try {
          console.error('Request data:', JSON.parse(originalRequest.data));
        } catch (e) {
          console.error('Request data (not JSON):', originalRequest.data);
        }
      }
    } else if (error.request) {
      console.error('No response received. Request details:', error.request);
    }
    
    // If error is 401 (Unauthorized) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          console.log('Attempting to refresh token');
          const refreshResponse = await axios.post('/api/auth/refresh-token', {
            refreshToken
          });
          
          const { accessToken } = refreshResponse.data;
          
          // Update token in localStorage (store in both places for compatibility)
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('token', accessToken);
          
          // Update authorization header and retry the request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } else {
          console.warn('No refresh token available');
        }
      } catch (refreshError) {
        // If refresh token is invalid, clear tokens and redirect to login
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 