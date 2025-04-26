import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Container,
  useTheme,
  Badge,
  Tooltip
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import useAuth from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './common/NotificationBell';

const Header = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = async () => {
    await logout();
    handleClose();
    navigate('/login');
  };
  
  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };
  
  // Get initials for avatar
  const getInitials = () => {
    if (!currentUser || !currentUser.name) return '?';
    return currentUser.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get profile image or use initials
  const getProfileDisplay = () => {
    console.log('Current user in Header:', currentUser);
    
    if (currentUser?.profileImage) {
      console.log('Using profile image from currentUser:', currentUser.profileImage);
      return <Avatar sx={{ width: 40, height: 40 }} src={currentUser.profileImage} alt={currentUser.name} />;
    }
    
    // Check localStorage for profile image (for local demo)
    const storedProfile = localStorage.getItem('userProfile');
    console.log('Stored profile from localStorage:', storedProfile);
    
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        console.log('Parsed profile:', profile);
        if (profile.profileImage) {
          console.log('Using profile image from localStorage:', profile.profileImage);
          return <Avatar sx={{ width: 40, height: 40 }} src={profile.profileImage} alt={currentUser?.name} />;
        }
      } catch (err) {
        console.error('Error parsing stored profile:', err);
      }
    }
    
    console.log('Falling back to initials:', getInitials());
    // Fallback to initials
    return (
      <Avatar sx={{ width: 40, height: 40, bgcolor: 'secondary.main', boxShadow: 2 }}>
        {getInitials()}
      </Avatar>
    );
  };
  
  // Determine dashboard link based on user role
  const getDashboardLink = () => {
    if (!currentUser) return '/login';
    
    switch (currentUser.userType) {
      case 'admin':
        return '/admin';
      case 'restaurant-admin':
        return '/restaurant';
      case 'delivery-personnel':
        return '/delivery';
      case 'customer':
        return '/customer';
      default:
        return '/login';
    }
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{
        backgroundImage: 'none',
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, sm: 70 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RestaurantMenuIcon
              sx={{
                mr: 2,
                fontSize: 32,
                color: theme.palette.primary.main
              }}
            />
            <Typography
              variant="h5"
              component={Link}
              to="/"
              sx={{ 
                textDecoration: 'none', 
                color: 'inherit',
                fontWeight: 700,
                backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Tasty Eats
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <ThemeToggle />
          
          {isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Dashboard">
                <Button 
                  component={Link} 
                  to={getDashboardLink()}
                  sx={{ 
                    mx: 1,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      color: theme.palette.primary.main
                    },
                    display: { xs: 'none', md: 'flex' }
                  }}
                  startIcon={<DashboardIcon />}
                >
                  Dashboard
                </Button>
              </Tooltip>
              
              <Box sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }}>
                <NotificationBell />
              </Box>
              
              <Tooltip title="Account">
                <IconButton
                  onClick={handleMenu}
                  edge="end"
                  sx={{
                    ml: 1,
                    p: 0.5,
                    border: `2px solid ${theme.palette.primary.main}`,
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  {getProfileDisplay()}
                </IconButton>
              </Tooltip>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    overflow: 'visible',
                    mt: 1.5,
                    borderRadius: 2,
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {currentUser?.name || 'User'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentUser?.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
                  <AccountCircleIcon sx={{ mr: 2, fontSize: 20 }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                  <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                component={Link} 
                to="/login"
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mx: 1
                }}
              >
                Login
              </Button>
              <Button 
                color="primary" 
                variant="contained" 
                component={Link} 
                to="/register"
                sx={{ fontWeight: 600, boxShadow: 2 }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 