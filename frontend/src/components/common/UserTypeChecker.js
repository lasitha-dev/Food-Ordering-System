import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import useAuth from '../../hooks/useAuth';

const UserTypeChecker = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [localStorageData, setLocalStorageData] = useState({});

  useEffect(() => {
    console.log('UserTypeChecker - currentUser:', currentUser);
    console.log('UserTypeChecker - isAuthenticated:', isAuthenticated);
    console.log('UserTypeChecker - userType:', currentUser?.userType);
    
    // Check localStorage
    try {
      const userProfile = localStorage.getItem('userProfile');
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo');
      
      setLocalStorageData({
        userProfile: userProfile ? JSON.parse(userProfile) : null,
        token: token ? 'Present (not shown)' : null,
        userInfo: userInfo ? JSON.parse(userInfo) : null
      });
      
      console.log('UserTypeChecker - localStorage:', {
        userProfile: userProfile ? JSON.parse(userProfile) : null,
        token: token ? 'Present (not shown)' : null,
        userInfo: userInfo ? JSON.parse(userInfo) : null
      });
    } catch (error) {
      console.error('Error parsing localStorage:', error);
    }
  }, [currentUser, isAuthenticated]);

  // Force the userType to 'customer' for testing
  const forceCustomerType = () => {
    try {
      // Update userProfile in localStorage
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        const profileData = JSON.parse(userProfile);
        profileData.userType = 'customer';
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        
        // Refresh the page to apply changes
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating userType:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        zIndex: 9999,
        padding: 2,
        maxWidth: 400,
        opacity: 0.9
      }}
    >
      <Typography variant="h6" gutterBottom>User Debug Info</Typography>
      <Typography variant="body2"><strong>ID:</strong> {currentUser?.id}</Typography>
      <Typography variant="body2"><strong>Name:</strong> {currentUser?.name}</Typography>
      <Typography variant="body2"><strong>Email:</strong> {currentUser?.email}</Typography>
      <Typography variant="body2"><strong>User Type:</strong> {currentUser?.userType}</Typography>
      <Typography variant="body2"><strong>Is Customer:</strong> {String(currentUser?.userType === 'customer')}</Typography>
      
      <Typography variant="subtitle1" sx={{ mt: 2 }}>LocalStorage Data:</Typography>
      <Typography variant="body2"><strong>userProfile.userType:</strong> {localStorageData?.userProfile?.userType}</Typography>
      <Typography variant="body2"><strong>userInfo.userType:</strong> {localStorageData?.userInfo?.userType}</Typography>
      
      <Box sx={{ mt: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="small" 
          onClick={forceCustomerType}
        >
          Force Customer Type
        </Button>
      </Box>
    </Paper>
  );
};

export default UserTypeChecker; 