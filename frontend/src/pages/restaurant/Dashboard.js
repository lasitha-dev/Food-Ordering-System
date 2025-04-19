import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Card,
  CardContent,
  Button
} from '@mui/material';
import {
  LocalDining as FoodItemIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import FoodItemsByCategory from '../../components/restaurant/FoodItemsByCategory';

const RestaurantDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Restaurant Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          Welcome back, {currentUser?.name || 'Restaurant Admin'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <FoodItemsByCategory />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RestaurantDashboard; 