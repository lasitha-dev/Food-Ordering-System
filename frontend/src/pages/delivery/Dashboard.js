import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardActions,
  Grid, 
  Button, 
  Chip, 
  Paper, 
  Divider, 
  CircularProgress,
  IconButton,
  Stack,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  Badge,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
  Phone as PhoneIcon,
  DirectionsBike as BikeIcon,
  DoneAll as DeliveredIcon,
  MyLocation as LocationOnIcon,
  DepartureBoard as DepartureBoardIcon,
  AccessTime as ClockIcon,
  MonetizationOn as MoneyIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import orderService from '../../services/orderService';
import userService from '../../services/userService';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), 'PPP p');
  } catch (error) {
    return 'Invalid date';
  }
};

const getStatusChipColor = (status) => {
  switch (status) {
    case 'Assigned':
      return 'primary';
    case 'Accepted':
      return 'info';
    case 'Picked Up':
      return 'warning';
    case 'Delivered':
      return 'success';
    case 'Rejected':
      return 'error';
    default:
      return 'default';
  }
};

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch assigned orders
  const fetchAssignedOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getAssignedOrders();
      if (response && response.data) {
        setOrders(response.data);
        applyFilters(response.data);
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
      setError(null);
    } catch (error) {
      console.error('Error fetching assigned orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await userService.getUserProfile();
      if (response && response.success) {
        setUserProfile(response.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAssignedOrders();
    fetchUserProfile();
  }, []);

  // Apply filters to orders
  const applyFilters = (ordersList = orders) => {
    let result = [...ordersList];
    
    // Filter based on tab selection
    if (activeTab === 1) { // New Orders (Assigned)
      result = result.filter(order => order.deliveryStatus === 'Assigned');
    } else if (activeTab === 2) { // Active Orders (Accepted or Picked Up)
      result = result.filter(order => 
        order.deliveryStatus === 'Accepted' || 
        order.deliveryStatus === 'Picked Up'
      );
    } else if (activeTab === 3) { // Completed Orders
      result = result.filter(order => order.deliveryStatus === 'Delivered');
    }
    
    // Set filtered orders
    setFilteredOrders(result);
  };

  // Handle filter changes
  useEffect(() => {
    applyFilters();
  }, [activeTab]);

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchAssignedOrders();
  };

  // View order details
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };

  // Close order details dialog
  const handleCloseOrderDetails = () => {
    setOrderDetailsOpen(false);
    setSelectedOrder(null);
  };

  // Open status update dialog
  const handleOpenUpdateStatus = (order) => {
    setSelectedOrder(order);
    setUpdateStatusOpen(true);
  };

  // Close status update dialog
  const handleCloseUpdateStatus = () => {
    setUpdateStatusOpen(false);
    setSelectedOrder(null);
  };

  // Accept order
  const handleAcceptOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      await orderService.updateDeliveryStatus(selectedOrder._id, 'Accepted');
      
      // Update local state
      const updatedOrders = orders.map(order => 
        order._id === selectedOrder._id 
          ? { ...order, deliveryStatus: 'Accepted', deliveryAcceptedAt: new Date().toISOString() } 
          : order
      );
      
      setOrders(updatedOrders);
      applyFilters(updatedOrders);
      
      setSnackbar({
        open: true,
        message: 'Order accepted successfully',
        severity: 'success'
      });
      
      handleCloseUpdateStatus();
    } catch (error) {
      console.error('Error accepting order:', error);
      setSnackbar({
        open: true,
        message: 'Failed to accept order',
        severity: 'error'
      });
    }
  };

  // Update to picked up status
  const handlePickupOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      await orderService.updateDeliveryStatus(selectedOrder._id, 'Picked Up');
      
      // Update local state
      const updatedOrders = orders.map(order => 
        order._id === selectedOrder._id 
          ? { ...order, deliveryStatus: 'Picked Up', deliveryPickedUpAt: new Date().toISOString() } 
          : order
      );
      
      setOrders(updatedOrders);
      applyFilters(updatedOrders);
      
      setSnackbar({
        open: true,
        message: 'Order marked as picked up',
        severity: 'success'
      });
      
      handleCloseUpdateStatus();
    } catch (error) {
      console.error('Error updating order status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update order status',
        severity: 'error'
      });
    }
  };

  // Complete delivery
  const handleCompleteDelivery = async () => {
    if (!selectedOrder) return;
    
    try {
      await orderService.updateDeliveryStatus(selectedOrder._id, 'Delivered');
      
      // Update local state
      const updatedOrders = orders.map(order => 
        order._id === selectedOrder._id 
          ? { 
              ...order, 
              deliveryStatus: 'Delivered', 
              status: 'Delivered',
              deliveryCompletedAt: new Date().toISOString() 
            } 
          : order
      );
      
      setOrders(updatedOrders);
      applyFilters(updatedOrders);
      
      setSnackbar({
        open: true,
        message: 'Delivery completed successfully',
        severity: 'success'
      });
      
      handleCloseUpdateStatus();
    } catch (error) {
      console.error('Error completing delivery:', error);
      setSnackbar({
        open: true,
        message: 'Failed to complete delivery',
        severity: 'error'
      });
    }
  };

  // Reject order
  const handleRejectOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      await orderService.updateDeliveryStatus(selectedOrder._id, 'Rejected');
      
      // Update local state
      const updatedOrders = orders.map(order => 
        order._id === selectedOrder._id 
          ? { ...order, deliveryStatus: 'Rejected' } 
          : order
      );
      
      setOrders(updatedOrders);
      applyFilters(updatedOrders);
      
      setSnackbar({
        open: true,
        message: 'Order rejected',
        severity: 'success'
      });
      
      handleCloseUpdateStatus();
    } catch (error) {
      console.error('Error rejecting order:', error);
      setSnackbar({
        open: true,
        message: 'Failed to reject order',
        severity: 'error'
      });
    }
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get status icon for order card
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Assigned':
        return <InfoIcon />;
      case 'Accepted':
        return <CheckCircleIcon color="info" />;
      case 'Picked Up':
        return <ShippingIcon color="warning" />;
      case 'Delivered':
        return <DeliveredIcon color="success" />;
      case 'Rejected':
        return <InfoIcon color="error" />;
      default:
        return <InfoIcon />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={handleRefresh} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  // Count orders by status
  const assignedCount = orders.filter(order => order.deliveryStatus === 'Assigned').length;
  const activeCount = orders.filter(order => 
    order.deliveryStatus === 'Accepted' || order.deliveryStatus === 'Picked Up'
  ).length;
  const completedCount = orders.filter(order => order.deliveryStatus === 'Delivered').length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header section with user info */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <BikeIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h5">
                Delivery Dashboard
              </Typography>
              {userProfile && (
                <Typography variant="body2" color="text.secondary">
                  Welcome, {userProfile.name}
                </Typography>
              )}
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>
        
        {/* Stats cards */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h6" color="text.secondary">New Orders</Typography>
                <Typography variant="h4">{assignedCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h6" color="text.secondary">Active Deliveries</Typography>
                <Typography variant="h4">{activeCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h6" color="text.secondary">Completed Today</Typography>
                <Typography variant="h4">{completedCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Tabs for filtering */}
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            label="All Orders" 
            icon={<InfoIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="New Orders" 
            icon={
              <Badge badgeContent={assignedCount} color="primary">
                <InfoIcon />
              </Badge>
            } 
            iconPosition="start"
          />
          <Tab 
            label="Active" 
            icon={
              <Badge badgeContent={activeCount} color="warning">
                <ShippingIcon />
              </Badge>
            } 
            iconPosition="start"
          />
          <Tab 
            label="Completed" 
            icon={<DeliveredIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>
      
      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No orders found in this category.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredOrders.map((order) => (
            <Grid item xs={12} md={6} lg={4} key={order._id}>
              <Card elevation={3} sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Order header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">
                        #{order._id.substring(0, 8)}...
                      </Typography>
                      {order.paymentMethod === 'cash' && (
                        <Tooltip title="Cash on Delivery">
                          <MoneyIcon color="warning" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                    <Chip 
                      label={order.deliveryStatus} 
                      color={getStatusChipColor(order.deliveryStatus)}
                      size="small"
                      icon={getStatusIcon(order.deliveryStatus)}
                    />
                  </Box>
                  
                  {/* Order time information */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ClockIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(order.createdAt)}
                    </Typography>
                  </Box>
                  
                  {/* Restaurant info */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Typography variant="subtitle1">
                      Pickup from Restaurant
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon fontSize="small" color="error" />
                      {order.restaurant ? order.restaurant.address : 'Restaurant Address'}
                    </Typography>
                  </Box>
                  
                  {/* Delivery Address */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Typography variant="subtitle1">
                      Deliver to
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon fontSize="small" color="primary" />
                      {order.deliveryAddress}
                    </Typography>
                    {order.customerPhone && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="primary" />
                        {order.customerPhone}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Order amount */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(order.total)}
                    </Typography>
                  </Box>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<InfoIcon />}
                    onClick={() => handleViewOrderDetails(order)}
                    fullWidth
                  >
                    View Details
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained"
                    color="primary"
                    startIcon={
                      order.deliveryStatus === 'Assigned' ? <CheckCircleIcon /> :
                      order.deliveryStatus === 'Accepted' ? <DepartureBoardIcon /> :
                      order.deliveryStatus === 'Picked Up' ? <DeliveredIcon /> :
                      <InfoIcon />
                    }
                    onClick={() => handleOpenUpdateStatus(order)}
                    disabled={order.deliveryStatus === 'Delivered' || order.deliveryStatus === 'Rejected'}
                    fullWidth
                  >
                    {order.deliveryStatus === 'Assigned' ? 'Accept' :
                     order.deliveryStatus === 'Accepted' ? 'Picked Up' :
                     order.deliveryStatus === 'Picked Up' ? 'Complete' :
                     'Update'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Order Details Dialog */}
      <Dialog open={orderDetailsOpen} onClose={handleCloseOrderDetails} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Order #{selectedOrder._id.substring(0, 8)}...
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1">Order Information</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Chip 
                    label={`Created: ${formatDate(selectedOrder.createdAt)}`} 
                    icon={<ClockIcon />}
                  />
                  <Chip 
                    label={`Payment: ${selectedOrder.paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery'}`} 
                    color={selectedOrder.paymentMethod === 'card' ? 'primary' : 'secondary'}
                    icon={selectedOrder.paymentMethod === 'card' ? <CheckCircleIcon /> : <MoneyIcon />}
                  />
                  <Chip 
                    label={`Status: ${selectedOrder.deliveryStatus}`} 
                    color={getStatusChipColor(selectedOrder.deliveryStatus)}
                    icon={getStatusIcon(selectedOrder.deliveryStatus)}
                  />
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Restaurant Information
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {selectedOrder.restaurant ? selectedOrder.restaurant.name : 'Restaurant Name'}
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOnIcon fontSize="small" color="error" />
                        {selectedOrder.restaurant ? selectedOrder.restaurant.address : 'Restaurant Address'}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Delivery Information
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="primary" />
                        {selectedOrder.deliveryAddress}
                      </Typography>
                      {selectedOrder.customerPhone && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" color="primary" />
                          {selectedOrder.customerPhone}
                        </Typography>
                      )}
                      {selectedOrder.additionalInstructions && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Instructions:</strong> {selectedOrder.additionalInstructions}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                Order Items
              </Typography>
              
              <Paper variant="outlined" sx={{ mb: 3 }}>
                <Box sx={{ p: 2 }}>
                  {selectedOrder.items.map((item, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      pb: 1,
                      mb: 1,
                      borderBottom: index < selectedOrder.items.length - 1 ? '1px solid #eee' : 'none'
                    }}>
                      <Typography variant="body2">
                        {item.quantity} x {item.title}
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(item.price * item.quantity)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Subtotal</Typography>
                    <Typography variant="body2">{formatCurrency(selectedOrder.subtotal)}</Typography>
                  </Box>
                  {selectedOrder.deliveryFee > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Delivery Fee</Typography>
                      <Typography variant="body2">{formatCurrency(selectedOrder.deliveryFee)}</Typography>
                    </Box>
                  )}
                  {selectedOrder.tip > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Tip</Typography>
                      <Typography variant="body2">{formatCurrency(selectedOrder.tip)}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #eee' }}>
                    <Typography variant="subtitle2">Total</Typography>
                    <Typography variant="subtitle2">{formatCurrency(selectedOrder.total)}</Typography>
                  </Box>
                </Box>
              </Paper>
              
              <Typography variant="subtitle1" gutterBottom>
                Delivery Status Timeline
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip 
                      label="Assigned" 
                      color={selectedOrder.deliveryStatus === 'Assigned' ? 'primary' : 'default'}
                      size="small"
                    />
                    <Typography variant="body2">
                      {formatDate(selectedOrder.createdAt)}
                    </Typography>
                  </Box>
                  
                  {(selectedOrder.deliveryStatus === 'Accepted' || 
                    selectedOrder.deliveryStatus === 'Picked Up' || 
                    selectedOrder.deliveryStatus === 'Delivered') && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip 
                        label="Accepted" 
                        color={selectedOrder.deliveryStatus === 'Accepted' ? 'primary' : 'default'}
                        size="small"
                      />
                      <Typography variant="body2">
                        {selectedOrder.deliveryAcceptedAt ? formatDate(selectedOrder.deliveryAcceptedAt) : 'Pending'}
                      </Typography>
                    </Box>
                  )}
                  
                  {(selectedOrder.deliveryStatus === 'Picked Up' || 
                    selectedOrder.deliveryStatus === 'Delivered') && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip 
                        label="Picked Up" 
                        color={selectedOrder.deliveryStatus === 'Picked Up' ? 'primary' : 'default'}
                        size="small"
                      />
                      <Typography variant="body2">
                        {selectedOrder.deliveryPickedUpAt ? formatDate(selectedOrder.deliveryPickedUpAt) : 'Pending'}
                      </Typography>
                    </Box>
                  )}
                  
                  {selectedOrder.deliveryStatus === 'Delivered' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip 
                        label="Delivered" 
                        color="success"
                        size="small"
                      />
                      <Typography variant="body2">
                        {selectedOrder.deliveryCompletedAt ? formatDate(selectedOrder.deliveryCompletedAt) : 'Pending'}
                      </Typography>
                    </Box>
                  )}
                  
                  {selectedOrder.deliveryStatus === 'Rejected' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip 
                        label="Rejected" 
                        color="error"
                        size="small"
                      />
                      <Typography variant="body2">
                        Order was rejected
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderDetails}>Close</Button>
          {selectedOrder && selectedOrder.deliveryStatus !== 'Delivered' && selectedOrder.deliveryStatus !== 'Rejected' && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => {
                handleCloseOrderDetails();
                handleOpenUpdateStatus(selectedOrder);
              }}
            >
              Update Status
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Update Status Dialog */}
      <Dialog open={updateStatusOpen} onClose={handleCloseUpdateStatus}>
        <DialogTitle>Update Delivery Status</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <DialogContentText>
                Current Status: <Chip 
                  label={selectedOrder.deliveryStatus} 
                  color={getStatusChipColor(selectedOrder.deliveryStatus)}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </DialogContentText>
              
              <Box sx={{ mt: 3 }}>
                {selectedOrder.deliveryStatus === 'Assigned' && (
                  <Stack spacing={2}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      fullWidth
                      startIcon={<CheckCircleIcon />}
                      onClick={handleAcceptOrder}
                    >
                      Accept Order
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error"
                      fullWidth
                      onClick={handleRejectOrder}
                    >
                      Reject Order
                    </Button>
                  </Stack>
                )}
                
                {selectedOrder.deliveryStatus === 'Accepted' && (
                  <Button 
                    variant="contained" 
                    color="primary"
                    fullWidth
                    startIcon={<DepartureBoardIcon />}
                    onClick={handlePickupOrder}
                  >
                    Mark as Picked Up
                  </Button>
                )}
                
                {selectedOrder.deliveryStatus === 'Picked Up' && (
                  <Button 
                    variant="contained" 
                    color="success"
                    fullWidth
                    startIcon={<DeliveredIcon />}
                    onClick={handleCompleteDelivery}
                  >
                    Mark as Delivered
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdateStatus}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DeliveryDashboard; 