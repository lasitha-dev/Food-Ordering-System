import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Divider, 
  useTheme,
  Avatar,
  Badge,
  Tooltip,
  Paper,
  Container
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import CategoryIcon from '@mui/icons-material/Category';
import AssessmentIcon from '@mui/icons-material/Assessment';
import useAuth from '../../hooks/useAuth';

// Sidebar width
const drawerWidth = 260;

const AdminLayout = () => {
  const theme = useTheme();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/admin',
      active: isActive('/admin') && !location.pathname.match(/\/admin\/.+/)
    },
    { 
      text: 'User Management', 
      icon: <PeopleIcon />, 
      path: '/admin/users',
      active: isActive('/admin/users')
    },
    { 
      text: 'Reports', 
      icon: <AssessmentIcon />, 
      path: '/admin/reports',
      active: isActive('/admin/reports')
    },
  ];
  
  const secondaryMenuItems = [
    { 
      text: 'Settings', 
      icon: <SettingsIcon />, 
      path: '/admin/settings',
      active: isActive('/admin/settings')
    },
  ];

  // Get profile display
  const getProfileDisplay = () => {
    const initials = currentUser?.name
      ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : 'AD';
    
    return (
      <Avatar 
        src={currentUser?.profileImage} 
        sx={{ 
          width: 40, 
          height: 40,
          bgcolor: theme.palette.primary.main,
          color: '#fff',
          fontWeight: 'bold'
        }}
      >
        {initials}
      </Avatar>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.mode === 'light' 
              ? theme.palette.grey[50] 
              : theme.palette.grey[900],
          },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
        }}>
          {/* Sidebar header with logo */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            padding: theme.spacing(2), 
            height: 70,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <RestaurantIcon 
              sx={{ 
                mr: 1.5, 
                color: theme.palette.primary.main,
                fontSize: 28
              }} 
            />
            <Typography 
              variant="h6" 
              fontWeight="bold"
              sx={{
                backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Admin Portal
            </Typography>
          </Box>
          
          {/* Admin profile info */}
          <Box sx={{ 
            p: 2.5, 
            display: 'flex', 
            alignItems: 'center', 
            borderBottom: `1px solid ${theme.palette.divider}`,
            mb: 1
          }}>
            {getProfileDisplay()}
            <Box sx={{ ml: 2 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ fontWeight: 600, lineHeight: 1.2 }}
              >
                {currentUser?.name || 'Admin User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System Administrator
              </Typography>
            </Box>
          </Box>
          
          {/* Main menu items */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', px: 2, py: 1 }}>
            <List component="nav" disablePadding>
              {menuItems.map((item) => (
                <ListItem 
                  button 
                  key={item.text} 
                  component={NavLink} 
                  to={item.path}
                  sx={{
                    mb: 0.5,
                    py: 1.2,
                    px: 2,
                    borderRadius: 2,
                    backgroundColor: item.active ? 
                      `${theme.palette.primary.main}15` : 'transparent',
                    color: item.active ? 
                      theme.palette.primary.main : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}10`,
                    },
                    '& .MuiListItemIcon-root': {
                      color: item.active ? 
                        theme.palette.primary.main : 'inherit',
                      minWidth: 36
                    }
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: item.active ? 600 : 400,
                      fontSize: '0.875rem'
                    }} 
                  />
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <List component="nav" disablePadding>
              {secondaryMenuItems.map((item) => (
                <ListItem 
                  button 
                  key={item.text} 
                  component={NavLink} 
                  to={item.path}
                  sx={{
                    mb: 0.5,
                    py: 1.2,
                    px: 2,
                    borderRadius: 2,
                    backgroundColor: item.active ? 
                      `${theme.palette.primary.main}15` : 'transparent',
                    color: item.active ? 
                      theme.palette.primary.main : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}10`,
                    },
                    '& .MuiListItemIcon-root': {
                      color: item.active ? 
                        theme.palette.primary.main : 'inherit',
                      minWidth: 36
                    }
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{ 
                      fontWeight: item.active ? 600 : 400,
                      fontSize: '0.875rem'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
          
          {/* Version info */}
          <Box sx={{ 
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: `1px solid ${theme.palette.divider}`,
          }}>
            <Typography variant="caption" color="text.secondary">
              Version 1.0.0
            </Typography>
          </Box>
        </Box>
      </Drawer>
      
      {/* Main content */}
      <Box component="main" sx={{ 
        flexGrow: 1, 
        p: 3,
        height: '100vh',
        overflow: 'auto',
        backgroundColor: theme.palette.background.default
      }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default AdminLayout; 