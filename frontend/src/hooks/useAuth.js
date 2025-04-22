import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

// Custom hook to use the auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  
  useEffect(() => {
    if (context?.currentUser) {
      // Log user type when it changes for debugging
      console.log('useAuth hook - Current user type:', 
        context.currentUser.userType,
        'User ID:', context.currentUser.id || context.currentUser._id
      );
    }
  }, [context?.currentUser]);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Add a helper function to get the current authentication token
// This can be used by other parts of the application to get the token consistently
export const getAuthToken = () => {
  // Try to get token directly from localStorage
  let token = localStorage.getItem('token');
  
  // If not found directly, check userInfo
  if (!token) {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        token = userInfo.token;
      } catch (e) {
        console.error('Error parsing userInfo from localStorage:', e);
      }
    }
  }
  
  return token;
};

export default useAuth; 