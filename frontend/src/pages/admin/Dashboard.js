import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  CircularProgress,
  Avatar,
  Tooltip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import useAuth from '../../hooks/useAuth';
import * as authApi from '../../services/auth-service/api';

const AdminDashboard = () => {
  const { currentUser, getUsersDirectly } = useAuth();
  const [userStats, setUserStats] = useState({
    total: 0,
    admins: 0,
    restaurantAdmins: 0,
    deliveryPersonnel: 0,
    customers: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Try using the API first - this should now work with our new endpoint
        const response = await authApi.getUserStats();
        
        // If the API is successful and contains data
        if (response && response.success && response.data) {
          setUserStats(response.data);
          setLoading(false);
          return;
        }
        
        // If the API returns an error but doesn't throw (our improved error handling)
        if (response && !response.success) {
          console.log('API stats endpoint returned an error, calculating manually:', response.message);
          // Continue to manual calculation below
        }
        
        // Calculate counts manually from users list - this is our fallback
        const usersResponse = await getUsersDirectly(1, 1000); // Get all users
        
        if (usersResponse && usersResponse.success && usersResponse.data) {
          const users = usersResponse.data.users || [];
          
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
            switch(user.userType) {
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
                break;
            }
          });
          
          setUserStats(stats);
        }
      } catch (err) {
        console.error('Error fetching user statistics:', err);
        setError('Failed to load user statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserStats();
  }, [getUsersDirectly]);

  const statCards = [
    {
      title: "Admins",
      value: userStats.admins,
      icon: <AdminPanelSettingsIcon sx={{ fontSize: 40 }} />,
      color: "#d32f2f", // error.dark
      bgColor: "#FFEBEE", // error.light with reduced opacity
    },
    {
      title: "Restaurant Admins",
      value: userStats.restaurantAdmins,
      icon: <RestaurantIcon sx={{ fontSize: 40 }} />,
      color: "#1976d2", // primary.dark
      bgColor: "#E3F2FD", // primary.light with reduced opacity
    },
    {
      title: "Delivery Personnel",
      value: userStats.deliveryPersonnel,
      icon: <LocalShippingIcon sx={{ fontSize: 40 }} />,
      color: "#388e3c", // success.dark
      bgColor: "#E8F5E9", // success.light with reduced opacity
    },
    {
      title: "Customers",
      value: userStats.customers, 
      icon: <PersonOutlineIcon sx={{ fontSize: 40 }} />,
      color: "#0288d1", // info.dark
      bgColor: "#E1F5FE", // info.light with reduced opacity
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Typography variant="subtitle1" color="textSecondary" paragraph>
        Welcome back, {currentUser?.name || 'Admin'}
      </Typography>
      
      {/* Main Stats Card */}
      <Card 
        elevation={2}
        sx={{ 
          mb: 4, 
          borderRadius: 3,
          overflow: 'visible',
          position: 'relative',
          backgroundImage: 'linear-gradient(120deg, #f0f2f5 0%, #e0f7fa 100%)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ position: 'absolute', top: -20, right: 30 }}>
            <Avatar 
              sx={{ 
                width: 64, 
                height: 64, 
                bgcolor: 'primary.main',
                boxShadow: 3
              }}
            >
              <PeopleIcon sx={{ fontSize: 40 }} />
            </Avatar>
          </Box>
          
          <Typography variant="h6" color="textSecondary" fontWeight={500} gutterBottom>
            Total Users
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" align="center">
              {error}
            </Typography>
          ) : (
            <>
              <Typography 
                variant="h2" 
                color="primary.dark" 
                fontWeight={600}
                sx={{ mb: 2 }}
              >
                {userStats.total}
              </Typography>
              
              <Typography variant="body2" color="textSecondary">
                Active users across all account types
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* User Type Cards */}
      {!loading && !error && (
        <Grid container spacing={3}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Tooltip title={`${stat.title} account${stat.value !== 1 ? 's' : ''}`} arrow>
                <Card 
                  elevation={2}
                  sx={{ 
                    p: 3, 
                    height: '100%',
                    borderRadius: 3,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 6
                    },
                    background: `linear-gradient(135deg, ${stat.bgColor} 0%, white 100%)`,
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <Box>
                      <Typography 
                        variant="h3" 
                        sx={{ fontWeight: 'bold', color: stat.color }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography 
                        variant="subtitle2" 
                        color="textSecondary"
                        sx={{ mt: 1, fontWeight: 'medium' }}
                      >
                        {stat.title}
                      </Typography>
                    </Box>
                    <Avatar
                      sx={{ 
                        bgcolor: stat.bgColor, 
                        color: stat.color,
                        width: 56,
                        height: 56
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                  </Box>
                </Card>
              </Tooltip>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AdminDashboard; 