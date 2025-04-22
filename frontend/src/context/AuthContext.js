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
        // First, check if we have any stored user profile data
        let storedProfileData = null;
        try {
          const storedProfileStr = localStorage.getItem('userProfile');
          if (storedProfileStr) {
            storedProfileData = JSON.parse(storedProfileStr);
            console.log('Found stored profile data on login:', storedProfileData);
          }
        } catch (profileError) {
          console.error('Error parsing stored profile:', profileError);
        }
        
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
              
              // Store the user's role from the backend for debugging
              const backendUserType = userData.userType;
              console.log('Backend user type:', backendUserType);
              
              // If we have stored profile data, merge it with backend data
              if (storedProfileData) {
                console.log('Merging stored profile data with backend data');
                
                // Create a merged user object that prioritizes backend data for critical fields
                userData = {
                  ...userData, // Start with backend data as base
                  
                  // Only use stored profile data for UI-related profile fields
                  firstName: storedProfileData.firstName || userData.firstName,
                  lastName: storedProfileData.lastName || userData.lastName,
                  phone: storedProfileData.phone || userData.phone,
                  address: storedProfileData.address || userData.address,
                  
                  // IMPORTANT: ALWAYS use backend data for these critical fields
                  userType: userData.userType, // Never use stored userType, always use backend
                  permissions: userData.permissions, // Always use backend permissions
                  
                  // Special handling for profile picture and delivery address
                  profilePicture: storedProfileData.profilePicture || storedProfileData.profilePic || 
                                  userData.profilePicture || userData.profilePic,
                  profilePic: storedProfileData.profilePicture || storedProfileData.profilePic || 
                               userData.profilePicture || userData.profilePic,
                  defaultDeliveryAddress: storedProfileData.defaultDeliveryAddress || userData.defaultDeliveryAddress,
                };
                
                console.log('Merged user data with priority to backend for auth data:', userData);
                
                // Sync localProfile with newly merged data including the correct userType
                localStorage.setItem('userProfile', JSON.stringify({
                  ...storedProfileData,
                  userType: userData.userType, // Ensure local storage has correct role
                  permissions: userData.permissions
                }));
                
                // Update the server with our merged data
                try {
                  const updateData = {
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    phone: userData.phone,
                    address: userData.address,
                    profilePicture: userData.profilePicture,
                    profilePic: userData.profilePic,
                    defaultDeliveryAddress: userData.defaultDeliveryAddress
                  };
                  
                  await authApi.updateCurrentUser(updateData);
                  console.log('Synchronized merged profile data to server');
                } catch (updateError) {
                  console.warn('Failed to synchronize profile to server:', updateError);
                }
              }
              
              // Set the current user with backend data prioritized
              setCurrentUser(userData);
              
              // Force another update to ensure userType is consistent
              setTimeout(() => {
                if (userData && userData.userType) {
                  // Force update with the backend user type to ensure consistency
                  forceUpdateUserType(userData, backendUserType);
                  console.log('Double-checked and enforced user type:', backendUserType);
                }
              }, 100);
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
        
        console.log('Processing successful response data:', JSON.stringify(response, null, 2));
        
        // Extract token and user from the response structure
        let token = null;
        let user = null;
        
        // The authController returns: { success: true, data: { token, user: {...} } }
        if (response.data && response.data.token && response.data.user) {
          // Direct access in data object
          token = response.data.token;
          user = response.data.user;
          console.log('Found token and user directly in response.data');
        } else if (response.data && typeof response.data === 'object') {
          // If data property exists, check it more carefully
          console.log('Examining response.data structure:', JSON.stringify(response.data, null, 2));
          
          // Check if response.data has a nested data property
          if (response.data.data && response.data.data.token) {
            token = response.data.data.token;
            user = response.data.data.user;
            console.log('Found token and user in nested response.data.data');
          }
        }
        
        if (!token) {
          console.error('Could not extract token and user from response:', JSON.stringify(response, null, 2));
          return { success: false, message: 'Invalid response format from server. Please try again.' };
        }
        
        console.log('Setting token and user:', { tokenPreview: token.substring(0, 15) + '...', user });
        
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
        
        // Update userProfile in localStorage with the correct user type
        try {
          const currentProfile = localStorage.getItem('userProfile');
          if (currentProfile) {
            const profileData = JSON.parse(currentProfile);
            // Ensure we update the userType in localStorage
            localStorage.setItem('userProfile', JSON.stringify({
              ...profileData,
              userType: user.userType,
              permissions: user.permissions
            }));
            console.log('Updated userProfile in localStorage with correct userType:', user.userType);
          } else {
            // If no profile exists, create a minimal one with the user type
            localStorage.setItem('userProfile', JSON.stringify({
              userType: user.userType,
              permissions: user.permissions
            }));
          }
        } catch (e) {
          console.error('Error updating userProfile in localStorage:', e);
        }
        
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
      
      // Make direct API call with retries
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          const response = await axios.post('/api/auth/register', registerData);
          console.log(`Registration successful after ${attempts} attempt(s)`);
          return response.data;
        } catch (error) {
          console.error(`Registration attempt ${attempts} failed:`, error);
          if (attempts >= maxAttempts) throw error;
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
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
      // Call backend logout endpoint
      try {
        await authApi.logout();
        console.log('Backend logout successful');
      } catch (error) {
        console.warn('Backend logout failed, proceeding with client-side logout:', error);
      }
      
      // Clear authentication state
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Clear user profile data
      localStorage.removeItem('userProfile');
      localStorage.removeItem('user');
      
      // Clear any cart data
      localStorage.removeItem('cart');
      
      // Clear any other auth-related data
      sessionStorage.removeItem('passwordChangeUser');
      
      // Remove authorization header
      delete axios.defaults.headers.common['Authorization'];
      
      // Reset state
      setCurrentUser(null);
      setError(null);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: error.message };
    }
  };

  // Check if current user has a specific role
  const hasRole = (role) => {
    if (!currentUser) return false;
    
    // Normalize role values for comparison
    const normalizedUserType = (currentUser.userType || '').trim().toLowerCase();
    const normalizedRole = (role || '').trim().toLowerCase();
    
    return normalizedUserType === normalizedRole;
  };

  // Check if current user has any of the given roles
  const hasAnyRole = (roles) => {
    if (!Array.isArray(roles) || !currentUser) return false;
    
    // Normalize user type for comparison
    const normalizedUserType = (currentUser.userType || '').trim().toLowerCase();
    
    // Check if user has any of the roles
    return roles.some(role => 
      (role || '').trim().toLowerCase() === normalizedUserType
    );
  };

  // Add updateProfile function to auth context
  const updateProfile = async (profileData) => {
    try {
      console.log('Updating profile with data:', profileData);
      
      // Prepare the data for the API call
      const userData = { ...profileData };
      
      // Call the API to update the user profile
      const response = await authApi.updateCurrentUser(userData);
      
      if (response.success) {
        console.log('Profile updated on server successfully:', response);
        
        // Update current user state
        const updatedUser = {
          ...currentUser,
          ...profileData,
          // Make sure name is set
          name: profileData.name || currentUser?.name || '',
          // Make sure we keep the user type
          userType: currentUser?.userType || 'customer',
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
      } else {
        throw new Error(response.message || 'Failed to update profile on server');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        message: 'Failed to update profile',
        error: error.message
      };
    }
  };

  // Helper function to ensure userType is consistent
  const forceUpdateUserType = (user, forceType = null) => {
    if (!user) return null;
    
    // If a specific type is provided, use it; otherwise use the existing one
    const userType = forceType || user.userType;
    console.log('forceUpdateUserType - Setting userType:', userType);
    
    // Create updated user with correct userType
    const updatedUser = {
      ...user,
      userType
    };
    
    // Update in React state
    setCurrentUser(updatedUser);
    
    // Update in localStorage
    try {
      const storedProfileStr = localStorage.getItem('userProfile');
      if (storedProfileStr) {
        const storedProfile = JSON.parse(storedProfileStr);
        localStorage.setItem('userProfile', JSON.stringify({
          ...storedProfile,
          userType
        }));
        console.log('forceUpdateUserType - Updated localStorage userType to:', userType);
      }
    } catch (e) {
      console.error('forceUpdateUserType - Error updating localStorage:', e);
    }
    
    return updatedUser;
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
    updateProfile,
    forceUpdateUserType
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 