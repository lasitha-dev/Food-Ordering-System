import axios from 'axios';
import { getAuthToken } from '../../hooks/useAuth';

// API configuration
const API_URL = process.env.REACT_APP_RESTAURANT_SERVICE_URL || 'http://localhost:3002';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Use the centralized getAuthToken function
    const token = getAuthToken();
    
    if (token) {
      console.log('Adding token to request headers:', token.substring(0, 15) + '...');
      config.headers.Authorization = `Bearer ${token}`;
      
      // For debugging - log the full headers being sent
      console.log('Request headers:', {
        ...config.headers,
        Authorization: config.headers.Authorization.substring(0, 20) + '...'
      });
    } else {
      console.warn('No auth token found for API request');
      
      // Log what's available in localStorage for debugging
      try {
        const keys = Object.keys(localStorage);
        console.log('Available localStorage keys:', keys);
        
        // Check for token-related keys
        for (const key of keys) {
          if (key.toLowerCase().includes('token') || key.toLowerCase().includes('user')) {
            console.log(`Found key ${key}:`, localStorage.getItem(key).substring(0, 20) + '...');
          }
        }
      } catch (error) {
        console.error('Error logging localStorage:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Server responded with an error status
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } 
    // Request made but no response received
    else if (error.request) {
      console.error('No response received', error.request);
    } 
    // Something else happened
    else {
      console.error('Error', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Food Item API functions
const foodItemApi = {
  // Get all food items for the restaurant admin
  getAllFoodItems: async () => {
    try {
      console.log('API Call: Get all food items');
      const response = await apiClient.get('/api/food-items');
      return response.data;
    } catch (error) {
      console.error('Error in getAllFoodItems API call:', error);
      // Re-throw for component to handle
      throw error;
    }
  },

  // Get all food items for customers (public endpoint)
  getPublicFoodItems: async () => {
    try {
      console.log('API Call: Get public food items');
      const response = await apiClient.get('/api/food-items/public');
      return response.data;
    } catch (error) {
      console.error('Error in getPublicFoodItems API call:', error);
      // Re-throw for component to handle
      throw error;
    }
  },

  // Get a single food item by ID
  getFoodItemById: async (id) => {
    try {
      console.log('API Call: Get food item by ID:', id);
      const response = await apiClient.get(`/api/food-items/${id}`);
      console.log('Food item by ID response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching food item ${id}:`, error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  },

  // Create a new food item
  createFoodItem: async (foodItemData) => {
    try {
      const response = await apiClient.post('/api/food-items', foodItemData);
      return response.data;
    } catch (error) {
      console.error('Error creating food item:', error);
      throw error;
    }
  },

  // Update an existing food item
  updateFoodItem: async (id, foodItemData) => {
    try {
      const response = await apiClient.put(`/api/food-items/${id}`, foodItemData);
      return response.data;
    } catch (error) {
      console.error(`Error updating food item ${id}:`, error);
      throw error;
    }
  },

  // Delete a food item
  deleteFoodItem: async (id) => {
    try {
      const response = await apiClient.delete(`/api/food-items/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting food item ${id}:`, error);
      throw error;
    }
  }
};

export default foodItemApi; 