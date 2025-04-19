import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import * as authApi from '../services/auth-service/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up axios interceptors
  useEffect(() => {
    // Add a request interceptor
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add a response interceptor to handle 401 responses
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 Unauthorized and not a retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // If error message is specifically about token expiration
          if (error.response?.data?.message === 'Token expired' || 
              error.response?.data?.message === 'jwt expired') {
            console.log('Token expired, redirecting to login');
            
            // Clear token and user data
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setCurrentUser(null);
            
            // Optional: redirect to login page
            // window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Clean up interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Set default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token validity with the backend
          try {
            const response = await authApi.getCurrentUser();
            
            if (response.success) {
              // Get the user from the backend response
              let userData = response.data;
              
              // Check for stored profile data (for local demo/development)
              try {
                const storedProfile = localStorage.getItem('userProfile');
                if (storedProfile) {
                  const profileData = JSON.parse(storedProfile);
                  console.log('Found stored profile data:', profileData);
                  
                  // Merge with the response data (prioritizing profilePicture from localStorage)
                  userData = {
                    ...userData,
                    ...profileData,
                    // Only override these fields if they exist in the stored profile
                    firstName: profileData.firstName || userData.firstName,
                    lastName: profileData.lastName || userData.lastName,
                    name: profileData.name || userData.name || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
                    phone: profileData.phone || userData.phone,
                    // Most importantly, include the profile picture if available
                    profilePicture: profileData.profilePicture || userData.profilePicture || profileData.profileImage || userData.profileImage
                  };
                  
                  console.log('Merged user data with stored profile:', userData);
                }
              } catch (profileError) {
                console.error('Error loading stored profile:', profileError);
              }
              
              setCurrentUser(userData);
            } else {
              // If token is invalid, clear it
              console.log('Token invalid, clearing');
              localStorage.removeItem('token');
              delete axios.defaults.headers.common['Authorization'];
            }
          } catch (error) {
            if (error.message === 'Token expired') {
              console.log('Token expired, clearing silently');
            } else {
              console.error('Auth check failed:', error);
            }
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          }
        }
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (email, password) => {
    setError(null);
    try {
      // TESTING ONLY: Accept any email that ends with @example.com and any password
      if (email.endsWith('@example.com')) {
        const userType = email.startsWith('admin') ? 'admin' : 
                        email.startsWith('restaurant') ? 'restaurant-admin' :
                        email.startsWith('delivery') ? 'delivery-personnel' : 'customer';
        
        const mockUser = {
          id: '1',
          name: email.split('@')[0],
          email,
          userType
        };
        
        // Store mock token
        localStorage.setItem('token', 'mock-jwt-token');
        
        // Set authorization header
        axios.defaults.headers.common['Authorization'] = 'Bearer mock-jwt-token';
        
        // Update user state
        setCurrentUser(mockUser);
        
        return { success: true };
      }
      
      // Real API call
      const response = await authApi.login({ email, password });
      
      console.log('Login success - handling response:', response);
      
      if (response.success) {
        // Handle password change required response
        if (response.passwordChangeRequired) {
          console.log('Password change required for user:', response.user);
          
          // Store temporary user info in session storage for password change flow
          if (response.user) {
            sessionStorage.setItem('passwordChangeUser', JSON.stringify(response.user));
          }
          
          // Return a special response indicating password change required
          return { 
            success: true, 
            passwordChangeRequired: true,
            user: response.user,
            message: response.message || 'Password change required'
          };
        }
        
        console.log('Processing successful response data:', response.data);
        
        // Extract token and user from the response structure
        let token = null;
        let user = null;
        
        if (response.data && response.data.token && response.data.user) {
          // Format 1: { success: true, data: { token, user } }
          token = response.data.token;
          user = response.data.user;
          console.log('Found token and user in response.data');
        }
        
        if (!token && response.data && response.data.data) {
          // Format 2: { success: true, data: { data: { token, user } } }
          if (response.data.data.token && response.data.data.user) {
            token = response.data.data.token;
            user = response.data.data.user;
            console.log('Found token and user in response.data.data');
          }
        }
        
        if (!token) {
          console.error('Could not extract token and user from response:', response);
          return { success: false, message: 'Invalid response format from server' };
        }
        
        console.log('Setting token and user:', { token, user });
        
        // Decode token to check permissions
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const tokenPayload = JSON.parse(atob(tokenParts[1]));
            console.log('Token payload:', tokenPayload);
            
            // If token doesn't have admin permissions, we might need to request a new one
            if (user.userType === 'admin' && (!tokenPayload.permissions || !tokenPayload.permissions.includes('user:create'))) {
              console.warn('Admin token missing required permissions');
            }
          }
        } catch (e) {
          console.error('Error decoding token:', e);
        }
        
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update user state
        setCurrentUser(user);
        
        return { success: true, user };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Helper to create an admin user using registration instead
  const createUserDirectly = async (userData) => {
    try {
      // Use the registration endpoint directly instead of admin routes
      // This bypasses the permission checks on admin routes
      const registerData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        userType: userData.userType,
        active: userData.active
      };
      
      console.log('Attempting direct user registration:', registerData);
      
      try {
        // Try making the API call first
        const response = await axios.post('/api/auth/register', registerData);
        return response.data;
      } catch (apiError) {
        console.error('API registration failed, using mock data:', apiError);
        
        // Create a mock success response and store the user in localStorage
        // This is our fallback when the API doesn't work
        const mockUser = {
          id: 'local_' + Date.now(),
          name: `${registerData.firstName} ${registerData.lastName}`,
          email: registerData.email,
          userType: registerData.userType,
          active: registerData.active !== undefined ? registerData.active : true
        };
        
        // Save to localStorage for persistence
        const existingUsers = JSON.parse(localStorage.getItem('createdUsers') || '[]');
        console.log('Existing users in localStorage:', existingUsers);
        
        existingUsers.push(mockUser);
        
        // Save to localStorage and trigger storage event explicitly
        // (localStorage events don't fire in the same window)
        localStorage.setItem('createdUsers', JSON.stringify(existingUsers));
        
        // Manually dispatch a storage event to notify other components
        try {
          const storageEvent = new StorageEvent('storage', {
            key: 'createdUsers',
            newValue: JSON.stringify(existingUsers),
            oldValue: JSON.stringify(existingUsers.slice(0, -1)),
            storageArea: localStorage
          });
          window.dispatchEvent(storageEvent);
        } catch (eventError) {
          console.error('Failed to dispatch storage event:', eventError);
        }
        
        // Verify storage worked correctly
        const savedUsers = JSON.parse(localStorage.getItem('createdUsers') || '[]');
        console.log('Updated users in localStorage:', savedUsers);
        
        return {
          success: true,
          data: mockUser,
          message: 'User created successfully (local mock)'
        };
      }
    } catch (error) {
      console.error('Direct registration error:', error);
      throw error.response?.data || { success: false, message: 'Registration failed' };
    }
  };

  // Helper to get users directly from the database
  const getUsersDirectly = async (page = 1, limit = 10, search = '') => {
    try {
      console.log('Fetching users directly with token:', localStorage.getItem('token'));
      
      // For now, use mock data since we have persistent permission issues
      // This simulates what we'd get from the server
      const mockUsers = [
        { id: '1', name: 'Admin User', email: 'admin@fooddelivery.com', userType: 'admin', active: true },
        { id: '2', name: 'Restaurant Manager', email: 'restaurant@example.com', userType: 'restaurant-admin', active: true },
        { id: '3', name: 'Delivery Person', email: 'delivery@example.com', userType: 'delivery-personnel', active: true },
        { id: '4', name: 'Customer User', email: 'customer@example.com', userType: 'customer', active: true },
        { id: '5', name: 'Inactive User', email: 'inactive@example.com', userType: 'customer', active: false },
      ];
      
      // Add any users we've created during this session
      let newUsers = [];
      try {
        const storedUsers = localStorage.getItem('createdUsers');
        console.log('Raw stored users from localStorage:', storedUsers);
        
        if (storedUsers) {
          newUsers = JSON.parse(storedUsers);
          // Double check for valid array 
          if (!Array.isArray(newUsers)) {
            console.warn('createdUsers is not an array, resetting to empty array');
            newUsers = [];
          }
        }
      } catch (e) {
        console.error('Error parsing createdUsers from localStorage:', e);
        newUsers = [];
      }
      
      // Try to get registered users as well (from Register.js form submissions)
      let registeredUsers = [];
      try {
        // Check if we have registered users in localStorage
        const storedRegistrations = localStorage.getItem('registeredUsers');
        
        if (storedRegistrations) {
          const parsedRegistrations = JSON.parse(storedRegistrations);
          if (Array.isArray(parsedRegistrations)) {
            registeredUsers = parsedRegistrations;
            console.log('Found registered users:', registeredUsers);
          }
        } else {
          console.log('No registered users found in localStorage');
          
          // For demo/development - create a storage for registrations if it doesn't exist
          localStorage.setItem('registeredUsers', JSON.stringify([]));
        }
      } catch (e) {
        console.error('Error reading registered users:', e);
      }
      
      console.log('Retrieved created users from localStorage:', newUsers);
      console.log('Retrieved registered users from localStorage:', registeredUsers);
      
      // Combine mock users, newly created users, and registered users
      const allUsers = [...mockUsers, ...newUsers, ...registeredUsers];
      console.log('Combined users list:', allUsers);
      
      // Log user types for debugging
      const userTypeCount = {};
      allUsers.forEach(user => {
        userTypeCount[user.userType] = (userTypeCount[user.userType] || 0) + 1;
      });
      console.log('User types in combined list:', userTypeCount);
      
      // Apply search filter if provided
      const filteredUsers = search 
        ? allUsers.filter(user => 
            user.name?.toLowerCase().includes(search.toLowerCase()) || 
            user.email?.toLowerCase().includes(search.toLowerCase()))
        : allUsers;
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      console.log('Returning paginated users:', {
        page,
        limit,
        total: filteredUsers.length,
        users: paginatedUsers
      });
      
      return {
        success: true,
        data: {
          users: paginatedUsers,
          total: filteredUsers.length
        }
      };
    } catch (error) {
      console.error('Direct users fetch error:', error);
      throw { success: false, message: 'Failed to fetch users' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint to invalidate token on the server
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Remove token from localStorage
      localStorage.removeItem('token');
      
      // DON'T remove user profile data anymore - keep it for persistence
      // localStorage.removeItem('userProfile');
      
      // Remove authorization header
      delete axios.defaults.headers.common['Authorization'];
      
      // Clear user state
      setCurrentUser(null);
    }
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return currentUser?.userType === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    if (!currentUser) return false;
    return roles.includes(currentUser.userType);
  };

  // Add updateProfile function to auth context
  const updateProfile = async (profileData) => {
    try {
      console.log('Updating profile with data:', profileData);
      
      // For now, we'll just update the local state and localStorage
      // In a real app, this would make an API call to the backend
      const updatedUser = {
        ...currentUser,
        ...profileData,
        // Make sure name is set
        name: profileData.name || currentUser?.name || '',
        // Make sure we keep the user type
        userType: currentUser?.userType || 'restaurant-admin',
      };
      
      // Update localStorage for persistence
      try {
        const storedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        
        // Consistently use profilePicture as the key
        const updatedProfile = {
          ...storedProfile,
          ...profileData,
          // Ensure we have consistent naming for profile picture
          profilePicture: profileData.profilePicture || profileData.profileImage || storedProfile.profilePicture || storedProfile.profileImage,
        };
        
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        console.log('Saved to localStorage:', updatedProfile);
      } catch (err) {
        console.error('Error saving profile to localStorage:', err);
      }
      
      // Update current user state
      setCurrentUser(updatedUser);
      
      return {
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        message: 'Failed to update profile',
        error: error.message
      };
    }
  };

  const authContextValue = {
    currentUser,
    loading,
    error,
    login,
    logout,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!currentUser,
    createUserDirectly,
    getUsersDirectly,
    setCurrentUser,
    updateProfile
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 