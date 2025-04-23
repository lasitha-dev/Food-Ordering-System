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
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import useAuth from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './common/NotificationBell';

const Header = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  
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
      return <Avatar sx={{ width: 32, height: 32 }} src={currentUser.profileImage} alt={currentUser.name} />;
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
          return <Avatar sx={{ width: 32, height: 32 }} src={profile.profileImage} alt={currentUser?.name} />;
        }
      } catch (err) {
        console.error('Error parsing stored profile:', err);
      }
    }
    
    console.log('Falling back to initials:', getInitials());
    // Fallback to initials
    return (
      <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
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
    <AppBar position="fixed">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'inherit',
            fontWeight: 'bold'
          }}
        >
          Food Delivery
        </Typography>
        
        <ThemeToggle />
        
        {isAuthenticated ? (
          <>
            <Button 
              color="inherit" 
              component={Link} 
              to={getDashboardLink()}
              sx={{ mx: 1 }}
            >
              Dashboard
            </Button>
            
            <NotificationBell />
            
            <IconButton
              onClick={handleMenu}
              color="inherit"
              edge="end"
            >
              {getProfileDisplay()}
            </IconButton>
            
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
            >
              <MenuItem disabled>
                <Typography variant="body2" color="textSecondary">
                  Signed in as {currentUser?.email}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleProfile}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </>
        ) : (
          <Box>
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
            <Button color="secondary" variant="contained" component={Link} to="/register">
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header; 