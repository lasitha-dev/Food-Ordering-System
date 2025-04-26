import axios from 'axios';

// Define API endpoints (using relative URLs to work with proxy)
const API_URL = '/api/auth';
const USERS_URL = '/api/users';
const ADMIN_URL = '/api/admin';

// Create a dedicated axios instance for auth service
const authAxios = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to include auth token
authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const login = async (credentials) => {
  try {
    console.log('Login request:', credentials);
    
    // For debugging - log headers and full request
    console.log('Login request config:', {
      url: `${API_URL}/login`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: JSON.stringify(credentials)
    });
    
    // Add timeout to avoid long-hanging requests
    const response = await authAxios.post(`${API_URL}/login`, credentials, {
      timeout: 5000, // 5 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Login response status:', response.status);
    console.log('Login response headers:', response.headers);
    console.log('Login response data:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: error.config
    });
    
    // Handle specific error types
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('Login request timed out');
      return { success: false, message: 'Login request timed out. Please try again.' };
    }
    
    if (!error.response) {
      console.error('No response from server - network error');
      return { success: false, message: 'Could not connect to authentication server. Please check your connection.' };
    }
    
    // Return standardized error format
    return error.response?.data || { success: false, message: 'Authentication failed. Please try again.' };
  }
};

export const register = async (userData) => {
  try {
    const response = await authAxios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Network error' };
  }
};

export const logout = async () => {
  try {
    const response = await authAxios.post(`${API_URL}/logout`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Network error' };
  }
};

export const getCurrentUser = async () => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Set up headers with token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Try multiple endpoints to ensure we get the current user data
    try {
      // First try the auth/me endpoint
      const response = await axios.get(`${API_URL}/me`, { headers });
      console.log('User data retrieved successfully via /auth/me endpoint:', response.data);
      return response.data;
    } catch (authError) {
      console.warn('Failed to get user data via /auth/me:', authError);
      
      try {
        // Try the users/me endpoint as fallback
        const response = await axios.get(`${USERS_URL}/me`, { headers });
        console.log('User data retrieved successfully via /users/me endpoint:', response.data);
        return response.data;
      } catch (usersError) {
        console.warn('Failed to get user data via /users/me:', usersError);
        
        // For development only - mock response if both API calls fail
        if (process.env.NODE_ENV === 'development') {
          console.warn('Using mock user data in development');
          // Try to get some data from localStorage as a fallback for development
          const storedUser = localStorage.getItem('user');
          const userProfile = localStorage.getItem('userProfile');
          
          if (storedUser || userProfile) {
            const userData = {
              ...(storedUser ? JSON.parse(storedUser) : {}),
              ...(userProfile ? JSON.parse(userProfile) : {})
            };
            
            return {
              success: true,
              data: userData
            };
          }
        }
        
        throw usersError;
      }
    }
  } catch (error) {
    console.error('Get current user error:', error);
    throw error.response?.data || { 
      success: false, 
      message: 'Failed to get current user: ' + (error.message || 'Unknown error')
    };
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await authAxios.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Network error' };
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await authAxios.post(`${API_URL}/reset-password`, { 
      token, 
      password: newPassword 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Network error' };
  }
};

// User management API calls
export const getUsers = async (page = 1, limit = 10, search = '', userType = '') => {
  try {
    // Build query parameters for pagination, search, and filter
    const queryParams = new URLSearchParams();
    
    // Add pagination
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    // Add search if provided
    if (search && search.trim() !== '') {
      queryParams.append('search', search.trim());
    }
    
    // Add userType filter if provided
    if (userType && userType.trim() !== '') {
      queryParams.append('userType', userType.trim());
    }
    
    const url = `${ADMIN_URL}/users?${queryParams.toString()}`;
    console.log(`Calling API with URL: ${url}`);
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Get users error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    throw error.response?.data || { success: false, message: 'Network error' };
  }
};

/**
 * Get users directly with pagination and search filtering support
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @param {string} search - Optional search term for filtering
 * @param {string} userType - Optional user type filter
 * @returns {Promise<Object>} User data response
 */
export const getUsersDirectly = async (page = 1, limit = 10, search = '', userType = '') => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);
    if (search) queryParams.append('search', search);
    if (userType) queryParams.append('userType', userType);
    
    // Make the API request
    const response = await axios.get(`${ADMIN_URL}/users?${queryParams.toString()}`);
    
    if (response.data.success) {
      return response.data;
    }
    
    return {
      success: false,
      message: 'Failed to get users directly',
      error: 'API returned failure'
    };
  } catch (error) {
    console.error('Failed to get users directly:', error);
    return {
      success: false,
      message: 'Failed to get users directly',
      error: error.message
    };
  }
};

export const getUserStats = async () => {
  try {
    // Try using admin endpoint for user statistics
    try {
      // This endpoint now exists, so it should work
      const response = await axios.get(`${ADMIN_URL}/users/stats`);
      return response.data;
    } catch (adminError) {
      console.error('Admin stats endpoint failed:', adminError);
      
      // If it's a 404 or 500 error, don't throw - we'll handle this by calculating stats manually
      // This prevents the error from breaking the app flow
      if (adminError.response && (adminError.response.status === 404 || adminError.response.status === 500)) {
        return { 
          success: false,
          message: 'Stats endpoint error',
          error: adminError.message
        };
      }
      
      throw adminError;
    }
  } catch (error) {
    console.error('Failed to fetch user statistics:', error);
    return { 
      success: false, 
      message: 'Failed to fetch user statistics',
      error: error.message
    };
  }
};

// Define protected demo user emails that shouldn't be edited/deleted
const PROTECTED_DEMO_USERS = [
  'admin@fooddelivery.com',
  'restaurant@example.com',
  'delivery@example.com'
];

// Define demo user data for protected accounts
const DEMO_USER_DATA = {
  'admin@fooddelivery.com': {
    id: 'demo_admin_001',
    email: 'admin@fooddelivery.com',
    firstName: 'System',
    lastName: 'Administrator',
    name: 'System Administrator',
    userType: 'admin',
    active: true,
    permissions: ['user:create', 'user:read', 'user:update', 'user:delete']
  },
  'restaurant@example.com': {
    id: 'demo_restaurant_001',
    email: 'restaurant@example.com',
    firstName: 'Restaurant',
    lastName: 'Manager',
    name: 'Restaurant Manager',
    userType: 'restaurant-admin',
    active: true,
    permissions: ['restaurant:manage', 'menu:manage']
  },
  'delivery@example.com': {
    id: 'demo_delivery_001',
    email: 'delivery@example.com',
    firstName: 'Delivery',
    lastName: 'Person',
    name: 'Delivery Person',
    userType: 'delivery-personnel',
    active: true,
    permissions: ['delivery:manage']
  }
};

export const getUser = async (userId) => {
  try {
    console.log(`Fetching user with ID: ${userId}`);
    
    // Check if this is a demo user by ID
    const demoUser = Object.values(DEMO_USER_DATA).find(user => user.id === userId);
    if (demoUser) {
      console.log('Found protected demo user by ID:', demoUser);
      return {
        success: true,
        data: demoUser
      };
    }
    
    // Check if this is a locally created user (ID starts with "local_")
    if (userId.toString().startsWith('local_')) {
      console.log('This is a locally created user, fetching from localStorage');
      
      // Try to get from createdUsers in localStorage
      const createdUsers = JSON.parse(localStorage.getItem('createdUsers') || '[]');
      let localUser = createdUsers.find(user => user.id === userId);
      
      // If not in createdUsers, check registeredUsers
      if (!localUser) {
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        localUser = registeredUsers.find(user => user.id === userId);
      }
      
      if (localUser) {
        // Check if this is a protected demo user by email
        if (PROTECTED_DEMO_USERS.includes(localUser.email)) {
          console.log('Found protected demo user by email:', localUser.email);
          return {
            success: true,
            data: DEMO_USER_DATA[localUser.email]
          };
        }
        
        console.log('Found local user:', localUser);
        return {
          success: true,
          data: localUser
        };
      } else {
        console.error('Local user not found in localStorage');
        throw { 
          success: false, 
          message: `User with ID ${userId} not found in local storage` 
        };
      }
    }
    
    // For regular users, try the API
    try {
      // Try admin endpoint first
      const response = await axios.get(`${ADMIN_URL}/users/${userId}`);
      
      // Check if the returned user is a protected demo user
      if (response.data?.data?.email && PROTECTED_DEMO_USERS.includes(response.data.data.email)) {
        console.log('Found protected demo user from API response:', response.data.data.email);
        return {
          success: true,
          data: DEMO_USER_DATA[response.data.data.email]
        };
      }
      
      console.log('User data from admin endpoint:', response.data);
      return response.data;
    } catch (adminError) {
      console.error('Admin endpoint failed, trying users endpoint:', adminError);
      
      // Fall back to users endpoint
      const response = await axios.get(`${USERS_URL}/${userId}`);
      
      // Check if the returned user is a protected demo user
      if (response.data?.data?.email && PROTECTED_DEMO_USERS.includes(response.data.data.email)) {
        console.log('Found protected demo user from users API:', response.data.data.email);
        return {
          success: true,
          data: DEMO_USER_DATA[response.data.data.email]
        };
      }
      
      console.log('User data from users endpoint:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Get user error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    throw error.response?.data || { success: false, message: 'Failed to fetch user data' };
  }
};

export const createUser = async (userData) => {
  try {
    console.log('Creating user with authorization:', {
      headers: axios.defaults.headers.common 
    });
    
    const response = await axios.post(`${ADMIN_URL}/users`, userData);
    
    // Add to localStorage as backup for demo/development
    if (response.data.success) {
      try {
        const newUser = response.data.data.user;
        if (newUser) {
          const existingUsers = JSON.parse(localStorage.getItem('createdUsers') || '[]');
          const userExists = existingUsers.some(user => user.email === newUser.email);
          
          if (!userExists) {
            localStorage.setItem('createdUsers', JSON.stringify([...existingUsers, {
              ...newUser,
              id: newUser.id || newUser._id || `local_${Date.now()}`
            }]));
            
            // Trigger storage event for other components
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch (storageError) {
        console.warn('Failed to store new user in localStorage:', storageError);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Create user error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    // Check for specific error types
    if (error.response?.data?.message?.includes('already exists')) {
      return {
        success: false,
        message: 'User with this email already exists',
        error: 'duplicate_email'
      };
    }
    
    if (error.response?.data) {
      return error.response.data;  // Return the error response from the server
    }
    
    // Default error
    return { 
      success: false, 
      message: error.message || 'Failed to create user',
      error: error.code || 'unknown_error'
    };
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await axios.put(`${ADMIN_URL}/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Update user error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    throw error.response?.data || { success: false, message: 'Network error' };
  }
};

export const deleteUser = async (userId) => {
  try {
    console.log(`Deleting user with ID: ${userId}`);
    
    const response = await axios.delete(`${ADMIN_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Delete user error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    throw error.response?.data || { success: false, message: 'Network error' };
  }
};

export const setUserActive = async (userId, active) => {
  try {
    console.log(`Setting user ${userId} active status to ${active}`);
    
    const response = await axios.patch(`${ADMIN_URL}/users/${userId}/active`, { active });
    return response.data;
  } catch (error) {
    console.error('Set user active error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    throw error.response?.data || { success: false, message: 'Network error' };
  }
};

export const resetUserPassword = async (userId) => {
  try {
    console.log(`Resetting password for user with ID: ${userId}`);
    
    // Check if this is a local user by ID prefix
    if (userId.startsWith('local_')) {
      // Generate a random temporary password for local users
      const tempPassword = Math.random().toString(36).slice(-8);
      
      console.log('Generated temporary password for local user:', tempPassword);
      
      // For demo/development purposes, we'll just return the temp password
      return {
        success: true,
        message: 'Password reset successful for local user',
        data: {
          tempPassword
        }
      };
    }
    
    // Check if this is a demo user by ID
    const isDemoUserById = Object.values(DEMO_USER_DATA).some(user => user.id === userId);
    if (isDemoUserById) {
      console.log('Cannot reset password for protected demo user with ID:', userId);
      throw new Error('Demo account passwords cannot be reset.');
    }
    
    // Use the admin endpoint for password reset
    const response = await axios.put(`${ADMIN_URL}/users/${userId}/reset-password`);
    console.log('Password reset response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Reset password error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    throw error.response?.data || { 
      success: false, 
      message: error.message || 'Failed to reset password'
    };
  }
};

export const changePassword = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/change-password`, userData);
    return response.data;
  } catch (error) {
    console.error('Change password error:', error);
    throw error.response?.data || { success: false, message: 'Failed to change password' };
  }
};

export const updateCurrentUser = async (userData) => {
  try {
    console.log('Updating current user profile with data:', userData);
    
    // Prepare FormData if needed
    let dataToSend = userData;
    if (userData.profilePicture && typeof userData.profilePicture === 'object') {
      // If we have a file upload, use FormData
      const formData = new FormData();
      Object.keys(userData).forEach(key => {
        if (key === 'profilePicture' && userData[key] instanceof File) {
          formData.append('profilePicture', userData[key]);
        } else {
          formData.append(key, userData[key]);
        }
      });
      dataToSend = formData;
    }
    
    // Common headers for all requests
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': token ? `Bearer ${token}` : ''
    };
    
    // Add Content-Type if not using FormData
    if (!(dataToSend instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Try multiple endpoints to ensure we hit the right one
    try {
      // First try the user's endpoint
      const response = await axios.put(`${API_URL}/me`, dataToSend, { headers });
      console.log('Profile updated successfully via /me endpoint:', response.data);
      return response.data;
    } catch (apiError) {
      console.warn('API user update via /me failed:', apiError);
      
      try {
        // Try the users endpoint
        const response = await axios.put(`${USERS_URL}/profile`, dataToSend, { headers });
        console.log('Profile updated successfully via /profile endpoint:', response.data);
        return response.data;
      } catch (usersError) {
        console.warn('API user update via /profile failed:', usersError);
        
        // Final fallback - for development only
        if (process.env.NODE_ENV === 'development') {
          console.warn('Using mock response for profile update in development');
          return {
            success: true,
            message: 'Profile updated successfully (local development mock)',
            data: {
              ...(dataToSend instanceof FormData 
                ? Object.fromEntries(dataToSend.entries()) 
                : dataToSend)
            }
          };
        }
        
        throw usersError;
      }
    }
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error.response?.data || { 
      success: false, 
      message: 'Failed to update profile: ' + (error.message || 'Unknown error')
    };
  }
};

/**
 * Get user counts by role
 * @returns {Promise<Object>} Object containing user counts by role
 */
export const getUserCountsByRole = async () => {
  try {
    // Build query parameters to get all users without pagination
    const queryParams = new URLSearchParams();
    queryParams.append('limit', 1000); // Large limit to get all users
    
    const url = `${ADMIN_URL}/users?${queryParams.toString()}`;
    console.log(`Fetching user counts from: ${url}`);
    
    const response = await axios.get(url);
    
    if (response.data.success) {
      const users = response.data.data || [];
      
      // Initialize counters
      const stats = {
        total: users.length,
        admins: 0,
        restaurantAdmins: 0,
        deliveryPersonnel: 0,
        customers: 0
      };
      
      // Count each user type
      users.forEach(user => {
        const userType = (user.userType || '').toLowerCase();
        switch(userType) {
          case 'admin':
            stats.admins++;
            break;
          case 'restaurant-admin':
            stats.restaurantAdmins++;
            break;
          case 'delivery-personnel':
            stats.deliveryPersonnel++;
            break;
          case 'customer':
            stats.customers++;
            break;
          default:
            console.warn('Unknown user type:', userType);
            break;
        }
      });
      
      return {
        success: true,
        data: stats
      };
    }
    
    return {
      success: false,
      message: 'Failed to get user counts',
      error: 'API returned failure'
    };
  } catch (error) {
    console.error('Failed to get user counts:', error);
    return {
      success: false,
      message: 'Failed to get user counts',
      error: error.message
    };
  }
}; 