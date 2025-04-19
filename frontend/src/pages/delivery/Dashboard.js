import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import useAuth from '../../hooks/useAuth';

const DeliveryDashboard = () => {
  const { currentUser } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Delivery Personnel Dashboard
      </Typography>
      
      <Typography variant="subtitle1" color="textSecondary" paragraph>
        Welcome back, {currentUser?.name || 'Delivery Personnel'}
      </Typography>
      
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          This page is currently under development. Soon you'll be able to:
        </Typography>
        <ul>
          <li>View assigned deliveries</li>
          <li>Update delivery status</li>
          <li>Navigate to delivery locations</li>
          <li>View your delivery history</li>
        </ul>
      </Paper>
    </Box>
  );
};

export default DeliveryDashboard; 