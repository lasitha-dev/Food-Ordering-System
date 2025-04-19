import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import useAuth from '../../hooks/useAuth';

const CustomerDashboard = () => {
  const { currentUser } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Customer Dashboard
      </Typography>
      
      <Typography variant="subtitle1" color="textSecondary" paragraph>
        Welcome back, {currentUser?.name || 'Customer'}
      </Typography>
      
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          This page is currently under development. Soon you'll be able to:
        </Typography>
        <ul>
          <li>Browse restaurants</li>
          <li>Order food</li>
          <li>Track your deliveries</li>
          <li>View your order history</li>
        </ul>
      </Paper>
    </Box>
  );
};

export default CustomerDashboard; 