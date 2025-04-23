import React, { useState, useEffect } from 'react';
import { 
  IconButton, 
  Badge, 
  Menu, 
  MenuItem, 
  Typography, 
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Tooltip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import CircleIcon from '@mui/icons-material/Circle';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatDistanceToNow } from 'date-fns';
import useAuth from '../../hooks/useAuth';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';

// Socket connection with the notification service
let socket;

const NotificationBell = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Debug logging to inspect component state
  console.log('NotificationBell - Rendering with:', {
    pathname: location.pathname,
    isAuthenticated,
    currentUserType: currentUser?.userType,
    currentUserId: currentUser?.id || currentUser?._id,
    currentUser: currentUser ? JSON.stringify(currentUser) : null
  });
  
  // Connect to socket on component mount
  useEffect(() => {
    // Only connect if authenticated and we have a user ID
    if (isAuthenticated && currentUser?.id) {
      console.log('NotificationBell - Connecting to socket');
      
      // Connect to the notification service
      socket = io(process.env.REACT_APP_NOTIFICATION_SERVICE_URL || 'http://localhost:3006', {
        withCredentials: true
      });

      // Join the user's room
      socket.emit('join', currentUser.id);

      // Listen for new notifications
      socket.on('notification', (notification) => {
        console.log('NotificationBell - Received notification:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      // Cleanup on component unmount
      return () => {
        socket.disconnect();
      };
    }
  }, [currentUser, isAuthenticated]);

  // Fetch user notifications on mount and when user changes
  useEffect(() => {
    // Only fetch if authenticated and we have a user ID
    if (isAuthenticated && currentUser?.id) {
      console.log('NotificationBell - Fetching notifications');
      fetchNotifications();
    }
  }, [isAuthenticated, currentUser]);

  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${process.env.REACT_APP_NOTIFICATION_SERVICE_URL || 'http://localhost:3006'}/api/notifications/user/${currentUser.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('NotificationBell - Fetched notifications:', response.data);
      setNotifications(response.data.data);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    // If it's not read, mark it as read
    if (!notification.isRead) {
      try {
        const token = localStorage.getItem('token');
        
        await axios.put(
          `${process.env.REACT_APP_NOTIFICATION_SERVICE_URL || 'http://localhost:3006'}/api/notifications/${notification._id}/read`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // Update notification in state
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        
        // Decrement unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate to order details if it's an order-related notification
    if (notification.orderId) {
      navigate(`/customer/order-history?orderId=${notification.orderId}`);
      handleCloseMenu();
    }
  };

  const handleDeleteNotification = async (event, notificationId) => {
    // Stop propagation to prevent clicking the parent ListItem
    event.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(
        `${process.env.REACT_APP_NOTIFICATION_SERVICE_URL || 'http://localhost:3006'}/api/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Remove notification from state
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Update unread count if the notification was unread
      const wasUnread = notifications.find(n => n._id === notificationId)?.isRead === false;
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${process.env.REACT_APP_NOTIFICATION_SERVICE_URL || 'http://localhost:3006'}/api/notifications/user/${currentUser.id}/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update all notifications to read
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'DELIVERY_UPDATE':
        return <DeliveryDiningIcon color="primary" />;
      case 'ORDER_STATUS':
        return <RestaurantIcon color="secondary" />;
      default:
        return <AnnouncementIcon color="info" />;
    }
  };

  // Only show for authenticated users (removed path check for all users)
  if (!isAuthenticated || !currentUser || currentUser.userType !== 'customer') {
    console.log('NotificationBell - Not showing because user is not authenticated, currentUser is null, or user is not a customer');
    return null;
  }

  console.log('NotificationBell - Showing notification bell for customer:', currentUser.id);
  
  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={handleOpenMenu}
        aria-label="notifications"
        sx={{ mr: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 350,
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {loading ? (
          <MenuItem disabled>
            <Typography>Loading notifications...</Typography>
          </MenuItem>
        ) : notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography>No notifications</Typography>
          </MenuItem>
        ) : (
          <List sx={{ width: '100%', p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification._id}>
                <ListItem 
                  button 
                  onClick={() => handleNotificationClick(notification)}
                  alignItems="flex-start"
                  sx={{ 
                    bgcolor: notification.isRead ? 'transparent' : 'rgba(0, 0, 0, 0.04)',
                    pr: 2
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" component="span">
                          {notification.message}
                        </Typography>
                        {!notification.isRead && (
                          <CircleIcon 
                            sx={{ 
                              ml: 1, 
                              color: 'primary.main',
                              fontSize: 10 
                            }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Typography>
                    }
                  />
                  <Tooltip title="Delete notification">
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={(e) => handleDeleteNotification(e, notification._id)}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell; 