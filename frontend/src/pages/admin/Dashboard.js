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
  Tooltip,
  useTheme
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
  const theme = useTheme();
  const { currentUser, getUsersDirectly, forceUpdateUserType } = useAuth();
  const [userStats, setUserStats] = useState({
    total: 0,
    admins: 0,
    restaurantAdmins: 0,
    deliveryPersonnel: 0,
    customers: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Force admin user type enforcement
  useEffect(() => {
    console.log('Admin Dashboard - Current user upon loading:', currentUser);
    
    // If user exists but doesn't have admin role, force it
    if (currentUser && currentUser.userType !== 'admin') {
      console.warn('Admin Dashboard - User has incorrect role. Forcing admin role:', {
        current: currentUser.userType,
        forcing: 'admin'
      });
      
      // Force update to admin role
      forceUpdateUserType(currentUser, 'admin');
    }
  }, [currentUser, forceUpdateUserType]);

  useEffect(() => {
    const fetchUserStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Try using the API first - this should work with our users/stats endpoint
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
        const usersResponse = await getUsersDirectly(1, 1000, ""); // Get all users with no filtering
        
        if (usersResponse && usersResponse.success) {
          let users = [];
          
          // Handle different response formats
          if (Array.isArray(usersResponse.data)) {
            users = usersResponse.data;
          } else if (usersResponse.data && Array.isArray(usersResponse.data.users)) {
            users = usersResponse.data.users;
          } else {
            console.error('Unexpected response format:', usersResponse);
            users = [];
          }
          
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
                console.warn('Unknown user type:', user.userType);
                break;
            }
          });
          
          setUserStats(stats);
        } else {
          throw new Error('Failed to fetch users data');
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
      color: theme.palette.error.main,
      bgColor: theme.palette.error.light,
      gradient: 'linear-gradient(135deg, #FF8A80 0%, #FF5252 100%)'
    },
    {
      title: "Restaurant Admins",
      value: userStats.restaurantAdmins,
      icon: <RestaurantIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
      bgColor: theme.palette.primary.light,
      gradient: 'linear-gradient(135deg, #FFAB91 0%, #FF7043 100%)'
    },
    {
      title: "Delivery Personnel",
      value: userStats.deliveryPersonnel,
      icon: <LocalShippingIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.secondary.main,
      bgColor: theme.palette.secondary.light,
      gradient: 'linear-gradient(135deg, #80CBC4 0%, #26A69A 100%)'
    }
  ];

  return (
    <Box>
      <Box 
        sx={{ 
          mb: 4, 
          position: 'relative', 
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}` 
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Admin Dashboard
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          Welcome back, {currentUser?.name || 'Admin'} 👋
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          Manage your food ordering system from one central dashboard
        </Typography>
      </Box>
      
      {/* Main Stats Card */}
      <Card 
        elevation={0}
        sx={{ 
          mb: 5,
          borderRadius: 4,
          overflow: 'visible',
          position: 'relative',
          background: 'linear-gradient(135deg, #FF8A65 0%, #FF5722 100%)',
          color: 'white',
          boxShadow: '0px 10px 30px rgba(255, 87, 34, 0.3)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ position: 'absolute', top: -20, right: 30 }}>
            <Avatar 
              sx={{ 
                width: 64, 
                height: 64, 
                bgcolor: 'white',
                color: theme.palette.primary.main,
                boxShadow: '0px 8px 16px rgba(255, 87, 34, 0.24)'
              }}
            >
              <PeopleIcon sx={{ fontSize: 36 }} />
            </Avatar>
          </Box>
          
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1, opacity: 0.95 }}>
            Total Users
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress sx={{ color: 'white' }} />
            </Box>
          ) : error ? (
            <Typography color="white" align="center">
              {error}
            </Typography>
          ) : (
            <>
              <Typography 
                variant="h2" 
                fontWeight={700}
                sx={{ mb: 1 }}
              >
                {userStats.total}
              </Typography>
              
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Active users across your platform
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* User Type Cards */}
      {!loading && !error && (
        <Grid container spacing={3}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                elevation={0}
                sx={{ 
                  p: 3, 
                  height: '100%',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  background: stat.gradient,
                  color: 'white',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.16)'
                  },
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
                      sx={{ fontWeight: 700 }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ mt: 1, fontWeight: 500, opacity: 0.9 }}
                    >
                      {stat.title}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.24)',
                      color: 'white',
                      width: 56,
                      height: 56,
                      boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Recent Activity Section - Placeholder for future enhancement */}
      <Box sx={{ mt: 6, mb: 4 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Card
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 3,
                backgroundColor: theme.palette.background.subtle,
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  mb: 2,
                  background: 'linear-gradient(135deg, #FFAB91 0%, #FF7043 100%)',
                }}
              >
                <PeopleIcon sx={{ fontSize: 36 }} />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                User Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add, edit, or manage user accounts and permissions
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminDashboard; 