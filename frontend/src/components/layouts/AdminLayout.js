import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';

// Sidebar width
const drawerWidth = 240;

const AdminLayout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            top: '64px', // Header height
            height: 'calc(100vh - 64px)'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem component={NavLink} to="/admin" end sx={{ 
              color: 'inherit', 
              textDecoration: 'none',
              '&.active': {
                bgcolor: 'rgba(0, 0, 0, 0.08)',
              }
            }}>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            
            <ListItem component={NavLink} to="/admin/users" sx={{ 
              color: 'inherit', 
              textDecoration: 'none',
              '&.active': {
                bgcolor: 'rgba(0, 0, 0, 0.08)',
              }
            }}>
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="User Management" />
            </ListItem>
            
            <Divider sx={{ my: 1 }} />
            
            <ListItem component={NavLink} to="/admin/settings" sx={{ 
              color: 'inherit', 
              textDecoration: 'none',
              '&.active': {
                bgcolor: 'rgba(0, 0, 0, 0.08)',
              }
            }}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      
      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout; 