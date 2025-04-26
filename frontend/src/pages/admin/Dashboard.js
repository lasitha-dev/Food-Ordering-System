import React, { useState, useEffect, useCallback } from 'react';
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
  useTheme,
  Button,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssessmentIcon from '@mui/icons-material/Assessment';
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
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Function to refresh user stats - make it reusable with useCallback
  const fetchUserStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the new getUserCountsByRole function first
      const response = await authApi.getUserCountsByRole();
      
      // If successful, use the data
      if (response && response.success && response.data) {
        setUserStats(response.data);
        setLoading(false);
        console.log('Updated user counts:', response.data);
        return;
      }
      
      // Try using the getUserStats API endpoint as fallback
      const statsResponse = await authApi.getUserStats();
      
      // If the API is successful and contains data
      if (statsResponse && statsResponse.success && statsResponse.data) {
        setUserStats(statsResponse.data);
        setLoading(false);
        return;
      }
      
      // If both methods fail, calculate manually as last resort
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
  }, [getUsersDirectly]);

  // Listen for custom events from UserManagement page
  useEffect(() => {
    // Function to handle user count updates from UserManagement
    const handleUserListChange = () => {
      console.log('Received userListChange event, refreshing user counts');
      fetchUserStats();
    };
    
    // Listen for events from UserManagement page when users are added/deleted
    window.addEventListener('userListRefresh', handleUserListChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'createdUsers') {
        console.log('Detected createdUsers change in localStorage, refreshing counts');
        fetchUserStats();
      }
    });
    
    return () => {
      window.removeEventListener('userListRefresh', handleUserListChange);
      window.removeEventListener('storage', handleUserListChange);
    };
  }, [fetchUserStats]);

  // Fetch user stats on component mount and when refreshKey changes
  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats, refreshKey]);

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const statCards = [
    {
      title: "Admins",
      value: userStats.admins,
      icon: <AdminPanelSettingsIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.error.main,
      bgColor: theme.palette.error.light,
      gradient: 'linear-gradient(45deg, #FF5252 30%, #FF8A80 90%)',
      link: '/admin/users?role=admin'
    },
    {
      title: "Restaurant Admins",
      value: userStats.restaurantAdmins,
      icon: <RestaurantIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
      bgColor: theme.palette.primary.light,
      gradient: 'linear-gradient(45deg, #FF7043 30%, #FFAB91 90%)',
      link: '/admin/users?role=restaurant-admin'
    },
    {
      title: "Delivery Personnel",
      value: userStats.deliveryPersonnel,
      icon: <LocalShippingIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.secondary.main,
      bgColor: theme.palette.secondary.light,
      gradient: 'linear-gradient(45deg, #26A69A 30%, #80CBC4 90%)',
      link: '/admin/users?role=delivery-personnel'
    }
  ];

  return (
    <Box>
      <Box 
        sx={{ 
          mb: 4, 
          position: 'relative', 
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
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
        
        <Button 
          startIcon={<RefreshIcon />}
          variant="outlined"
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {/* Main Stats Card */}
      <Card 
        elevation={2}
        sx={{ 
          mb: 5,
          borderRadius: 4,
          overflow: 'visible',
          position: 'relative',
          background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)',
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
                sx={{ 
                  mb: 1,
                  fontSize: { xs: '2.5rem', sm: '3rem', md: '3.75rem' } 
                }}
              >
                {userStats.total}
              </Typography>
              
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Active users across your platform
              </Typography>
              
              <Button 
                component={RouterLink} 
                to="/admin/users"
                sx={{ 
                  mt: 2, 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
                variant="outlined"
                size="small"
              >
                View All Users
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* User Type Cards */}
      {!loading && !error && (
        <Grid container spacing={3} sx={{ mt: 0 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={12} md={4} key={index}>
              <Card 
                elevation={2}
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
                  cursor: 'pointer',
                  overflow: 'visible',
                  position: 'relative',
                  minHeight: '140px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                component={RouterLink}
                to={stat.link}
                style={{ textDecoration: 'none' }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    px: 1
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 1,
                        fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 500, 
                        opacity: 0.9,
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}
                    >
                      {stat.title}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.24)',
                      color: 'white',
                      width: { xs: 48, sm: 56, md: 60 },
                      height: { xs: 48, sm: 56, md: 60 },
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
      
      {/* Quick Actions Section */}
      <Box sx={{ mt: 6, mb: 4 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
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
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.12)'
                },
                cursor: 'pointer'
              }}
              component={RouterLink}
              to="/admin/users"
              style={{ textDecoration: 'none' }}
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
          
          <Grid item xs={12} sm={6}>
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
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.12)'
                },
                cursor: 'pointer'
              }}
              component={RouterLink}
              to="/admin/reports"
              style={{ textDecoration: 'none' }}
            >
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  mb: 2,
                  background: 'linear-gradient(135deg, #80CBC4 0%, #26A69A 100%)',
                }}
              >
                <AssessmentIcon sx={{ fontSize: 36 }} />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate and download reports on user activity and system data
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminDashboard; 