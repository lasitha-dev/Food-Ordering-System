import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Toolbar,
  ListItemButton,
  AppBar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  IconButton
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  LocalDining as FoodItemIcon,
  ShoppingCart as OrdersIcon,
  InsertChart as ReportsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const drawerWidth = 240;

const RestaurantLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  
  // State for profile menu
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Handle profile menu open
  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle profile menu close
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle navigation to settings
  const handleSettingsClick = () => {
    handleClose();
    navigate('/restaurant/settings');
  };

  // Handle logout
  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/restaurant' },
    { text: 'Food Items', icon: <FoodItemIcon />, path: '/restaurant/food-items' },
    { text: 'Orders', icon: <OrdersIcon />, path: '/restaurant/orders' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/restaurant/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/restaurant/settings' },
  ];

  // Log menu items for debugging
  console.log('Restaurant menu items:', JSON.stringify(menuItems.map(item => ({ 
    text: item.text, 
    path: item.path, 
    disabled: item.disabled || false 
  }))));

  // Get profile picture or use initials as fallback
  const getProfileDisplay = () => {
    // If user has a profile picture, use it
    if (currentUser?.profilePicture) {
      return (
        <Avatar 
          src={currentUser.profilePicture} 
          alt={currentUser?.name || 'User'}
          sx={{ width: 40, height: 40, cursor: 'pointer' }}
          onClick={handleProfileClick}
        />
      );
    }
    
    // Otherwise use initials
    const initials = currentUser?.name
      ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
      : 'U';
    
    return (
      <Avatar 
        sx={{ width: 40, height: 40, bgcolor: 'primary.main', cursor: 'pointer' }}
        onClick={handleProfileClick}
      >
        {initials}
      </Avatar>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top AppBar with profile picture */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: 1
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {getProfileDisplay()}
          
          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
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
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleSettingsClick}>
              <ListItemIcon>
                <AccountIcon fontSize="small" />
              </ListItemIcon>
              Profile Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <Typography color="error">Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            backgroundColor: (theme) => theme.palette.background.default,
            borderRight: '1px solid rgba(0, 0, 0, 0.12)'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => {
              // Log each menu item rendering for debugging
              console.log(`Rendering menu item: ${item.text}, disabled: ${Boolean(item.disabled)}`);
              
              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    onClick={() => !item.disabled && navigate(item.path)}
                    selected={location.pathname === item.path || (item.path !== '/restaurant' && location.pathname.startsWith(item.path))}
                    disabled={item.disabled}
                    sx={{ 
                      '&.Mui-disabled': {
                        opacity: 0.6,
                      }
                    }}
                  >
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
          <Divider sx={{ mt: 2 }} />
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default RestaurantLayout; 