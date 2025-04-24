import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControlLabel,
  Switch,
  TextField,
  Divider,
  Tabs,
  Tab,
  Avatar,
  Stack
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Info as InfoIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  RestaurantMenu,
  FilterList as FilterIcon,
  DeliveryDining as DeliveryIcon,
  Search as SearchIcon,
  Payment as PaymentIcon,
  Money as CashIcon,
  CreditCard as CardIcon,
  AccessTime as PendingIcon,
  Done as DoneIcon,
  Person as PersonIcon,
  Delete as DeleteIcon
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

const getStatusColor = (status) => {
  switch (status) {
    case 'Placed':
      return 'info';
    case 'Confirmed':
      return 'primary';
    case 'Preparing':
      return 'warning';
    case 'Ready':
      return 'secondary';
    case 'Out for Delivery':
      return 'info';
    case 'Delivered':
      return 'success';
    case 'Cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'Placed':
      return <PendingIcon />;
    case 'Confirmed':
      return <CheckCircleIcon />;
    case 'Preparing':
      return <RestaurantMenu />;
    case 'Ready':
      return <DoneIcon />;
    case 'Out for Delivery':
      return <DeliveryIcon />;
    case 'Delivered':
      return <DoneIcon color="success" />;
    case 'Cancelled':
      return <InfoIcon color="error" />;
    default:
      return <InfoIcon />;
  }
};

const getPaymentStatusColor = (status) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'unpaid':
      return 'error';
    case 'refunded':
      return 'info';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

const getPaymentIcon = (method, status) => {
  if (method === 'card') {
    return <CardIcon color={status === 'paid' ? 'success' : 'error'} />;
  } else {
    return <CashIcon color={status === 'paid' ? 'success' : 'warning'} />;
  }
};

const getDeliveryStatusColor = (status) => {
  switch (status) {
    case 'Accepted':
      return 'success';
    case 'Assigned':
      return 'primary';
    case 'Picked Up':
      return 'info';
    case 'Delivered':
      return 'success';
    case 'Rejected':
      return 'error';
    case 'Unassigned':
    default:
      return 'warning';
  }
};

const RestaurantOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [assignDeliveryOpen, setAssignDeliveryOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState({
    cash: true,
    card: true
  });
  const [statusFilter, setStatusFilter] = useState({
    Placed: true,
    Confirmed: true,
    Preparing: true,
    Ready: true,
    OutForDelivery: true,
    Delivered: true,
    Cancelled: false
  });
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  
  // Fetch orders from API
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getRestaurantOrders();
      const ordersData = response.data || [];
      setOrders(ordersData);
      applyFilters(ordersData);
      setError(null);
    } catch (error) {
      console.error('Error fetching restaurant orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch delivery personnel for assignment
  const fetchDeliveryPersonnel = async () => {
    try {
      console.log('Fetching delivery personnel...');
      const response = await userService.getDeliveryPersonnel();
      console.log('Delivery personnel response:', response);
      
      // Handle different response structures
      if (response && response.data) {
        // Direct data array
        if (Array.isArray(response.data)) {
          setDeliveryPersonnel(response.data);
          console.log(`Found ${response.data.length} delivery personnel`);
        } 
        // Nested data with success property
        else if (response.success && Array.isArray(response.data)) {
          setDeliveryPersonnel(response.data);
          console.log(`Found ${response.data.length} delivery personnel`);
        }
        // Handle case where data might be in a nested property
        else if (response.data.deliveryPersonnel && Array.isArray(response.data.deliveryPersonnel)) {
          setDeliveryPersonnel(response.data.deliveryPersonnel);
          console.log(`Found ${response.data.deliveryPersonnel.length} delivery personnel`);
        }
        else {
          console.error('Unexpected response format:', response);
          setDeliveryPersonnel([]);
        }
      } else {
        console.error('Invalid response format:', response);
        setDeliveryPersonnel([]);
      }
    } catch (error) {
      console.error('Error fetching delivery personnel:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load delivery personnel',
        severity: 'error'
      });
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchOrders();
    fetchDeliveryPersonnel();
  }, []);
  
  // Apply filters to orders
  const applyFilters = (ordersList = orders) => {
    let result = [...ordersList];
    
    // Apply payment method filter
    if (!paymentFilter.cash || !paymentFilter.card) {
      if (!paymentFilter.cash) {
        result = result.filter(order => order.paymentMethod !== 'cash');
      }
      if (!paymentFilter.card) {
        result = result.filter(order => order.paymentMethod !== 'card');
      }
    }
    
    // Apply status filter
    const activeStatuses = Object.entries(statusFilter)
      .filter(([_, value]) => value)
      .map(([key, _]) => key === 'OutForDelivery' ? 'Out for Delivery' : key);
    
    if (activeStatuses.length < Object.keys(statusFilter).length) {
      result = result.filter(order => activeStatuses.includes(order.status));
    }
    
    // Apply unassigned filter
    if (showUnassignedOnly) {
      result = result.filter(order => !order.assignedTo);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order._id.toLowerCase().includes(query) ||
        order.deliveryAddress.toLowerCase().includes(query) ||
        (order.assignedToName && order.assignedToName.toLowerCase().includes(query))
      );
    }
    
    // Set filtered orders
    setFilteredOrders(result);
  };
  
  // Handle filter changes
  useEffect(() => {
    applyFilters();
  }, [paymentFilter, statusFilter, showUnassignedOnly, searchQuery]);
  
  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Update filters based on tab
    if (newValue === 0) { // All Orders
      setPaymentFilter({ cash: true, card: true });
      setShowUnassignedOnly(false);
    } else if (newValue === 1) { // Card Payments
      setPaymentFilter({ cash: false, card: true });
      setShowUnassignedOnly(false);
    } else if (newValue === 2) { // Cash on Delivery
      setPaymentFilter({ cash: true, card: false });
      setShowUnassignedOnly(false);
    } else if (newValue === 3) { // Unassigned
      setShowUnassignedOnly(true);
      setPaymentFilter({ cash: true, card: true });
    }
  };
  
  // Refresh data
  const handleRefresh = () => {
    fetchOrders();
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
  const handleOpenStatusUpdate = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusUpdateOpen(true);
  };
  
  // Close status update dialog
  const handleCloseStatusUpdate = () => {
    setStatusUpdateOpen(false);
    setSelectedOrder(null);
    setNewStatus('');
  };
  
  // Open delivery assignment dialog
  const handleOpenAssignDelivery = (order) => {
    setSelectedOrder(order);
    setSelectedDeliveryPersonId('');
    setAssignDeliveryOpen(true);
  };
  
  // Close delivery assignment dialog
  const handleCloseAssignDelivery = () => {
    setAssignDeliveryOpen(false);
    setSelectedOrder(null);
    setSelectedDeliveryPersonId('');
  };
  
  // Update order status
  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    
    try {
      await orderService.updateOrderStatus(selectedOrder._id, newStatus);
      
      // Update local state
      const updatedOrders = orders.map(order => 
        order._id === selectedOrder._id 
          ? { ...order, status: newStatus } 
          : order
      );
      
      setOrders(updatedOrders);
      applyFilters(updatedOrders);
      
      setSnackbar({
        open: true,
        message: `Order status updated to ${newStatus}`,
        severity: 'success'
      });
      
      handleCloseStatusUpdate();
    } catch (error) {
      console.error('Error updating order status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update order status',
        severity: 'error'
      });
    }
  };
  
  // Assign delivery personnel
  const handleAssignDelivery = async () => {
    if (!selectedOrder || !selectedDeliveryPersonId) return;
    
    try {
      // Find the selected delivery person's name
      const selectedPerson = deliveryPersonnel.find(
        person => person._id === selectedDeliveryPersonId
      );
      
      if (!selectedPerson) {
        throw new Error('Selected delivery personnel not found');
      }
      
      // Assign the order
      await orderService.assignOrderToDelivery(
        selectedOrder._id,
        selectedDeliveryPersonId,
        selectedPerson.name
      );
      
      // Update local state
      const updatedOrders = orders.map(order => 
        order._id === selectedOrder._id 
          ? { 
              ...order, 
              assignedTo: selectedDeliveryPersonId,
              assignedToName: selectedPerson.name,
              deliveryStatus: 'Assigned',
              status: 'Out for Delivery'
            } 
          : order
      );
      
      setOrders(updatedOrders);
      applyFilters(updatedOrders);
      
      setSnackbar({
        open: true,
        message: `Order assigned to ${selectedPerson.name}`,
        severity: 'success'
      });
      
      handleCloseAssignDelivery();
    } catch (error) {
      console.error('Error assigning delivery personnel:', error);
      setSnackbar({
        open: true,
        message: 'Failed to assign delivery personnel',
        severity: 'error'
      });
    }
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Handle open delete confirmation dialog
  const handleOpenDeleteConfirm = (order) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };
  
  // Handle close delete confirmation dialog
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setOrderToDelete(null);
  };
  
  // Handle delete order
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    setLoading(true);
    try {
      const response = await orderService.deleteOrder(orderToDelete._id);
      console.log('Delete order response:', response);
      
      // Remove the deleted order from the state
      const updatedOrders = orders.filter(order => order._id !== orderToDelete._id);
      setOrders(updatedOrders);
      applyFilters(updatedOrders);
      
      setSnackbar({
        open: true,
        message: 'Order successfully deleted',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      setSnackbar({
        open: true,
        message: `Failed to delete order: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      handleCloseDeleteConfirm();
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
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            Restaurant Orders
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>
        
        {/* Tabs for quick filtering */}
        <Box sx={{ width: '100%', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="All Orders" icon={<InfoIcon />} />
            <Tab label="Card Payments" icon={<CardIcon />} />
            <Tab label="Cash on Delivery" icon={<CashIcon />} />
            <Tab label="Unassigned" icon={<PersonIcon />} />
          </Tabs>
        </Box>
        
        {/* Search and filter bar */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={paymentFilter.card}
                    onChange={(e) => setPaymentFilter({...paymentFilter, card: e.target.checked})}
                  />
                }
                label="Card"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={paymentFilter.cash}
                    onChange={(e) => setPaymentFilter({...paymentFilter, cash: e.target.checked})}
                  />
                }
                label="Cash"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showUnassignedOnly}
                    onChange={(e) => setShowUnassignedOnly(e.target.checked)}
                  />
                }
                label="Unassigned Only"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No orders found matching your filters.
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
                    <Typography variant="h6">
                      #{order._id.substring(0, 8)}...
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title={`Payment: ${order.paymentMethod.toUpperCase()}`}>
                        {getPaymentIcon(order.paymentMethod, order.paymentStatus)}
                      </Tooltip>
                      <Tooltip title={`Status: ${order.status}`}>
                        {getStatusIcon(order.status)}
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  {/* Order date and amount */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(order.createdAt)}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(order.total)}
                    </Typography>
                  </Box>
                  
                  {/* Order status chips */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip 
                      label={order.status} 
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                    <Chip 
                      label={order.paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery'} 
                      color={order.paymentMethod === 'card' ? 'primary' : 'secondary'}
                      size="small"
                    />
                    <Chip 
                      label={order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)} 
                      color={getPaymentStatusColor(order.paymentStatus)}
                      size="small"
                    />
                  </Box>
                  
                  {/* Delivery assignment info */}
                  <Box sx={{ mb: 2 }}>
                    {order.assignedTo ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2">
                          {order.assignedToName}
                        </Typography>
                        <Chip 
                          label={order.deliveryStatus} 
                          color={getDeliveryStatusColor(order.deliveryStatus)}
                          size="small"
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No delivery personnel assigned
                        </Typography>
                        <Chip 
                          label="Unassigned" 
                          color="warning"
                          size="small"
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                    )}
                  </Box>
                  
                  {/* Order items summary */}
                  <Typography variant="body2" color="text.secondary">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Button 
                    size="small" 
                    startIcon={<InfoIcon />}
                    onClick={() => handleViewOrderDetails(order)}
                  >
                    Details
                  </Button>
                  <Box>
                    <Tooltip title="Update Order Status">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleOpenStatusUpdate(order)}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Assign Delivery">
                      <IconButton 
                        size="small" 
                        color="secondary"
                        onClick={() => handleOpenAssignDelivery(order)}
                        disabled={!!order.assignedTo}
                      >
                        <DeliveryIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Order">
                      <IconButton 
                        onClick={() => handleOpenDeleteConfirm(order)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
                  <Chip label={`Date: ${formatDate(selectedOrder.createdAt)}`} />
                  <Chip 
                    label={`Payment: ${selectedOrder.paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery'}`} 
                    color={selectedOrder.paymentMethod === 'card' ? 'primary' : 'secondary'} 
                  />
                  <Chip 
                    label={`Payment Status: ${selectedOrder.paymentStatus}`} 
                    color={getPaymentStatusColor(selectedOrder.paymentStatus)} 
                  />
                  <Chip 
                    label={`Status: ${selectedOrder.status}`} 
                    color={getStatusColor(selectedOrder.status)} 
                  />
                </Box>
                
                <Typography variant="body2" gutterBottom>
                  Delivery Address: {selectedOrder.deliveryAddress}
                </Typography>
                
                {selectedOrder.additionalInstructions && (
                  <Typography variant="body2" gutterBottom>
                    Instructions: {selectedOrder.additionalInstructions}
                  </Typography>
                )}
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                Delivery Information
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Delivery Status: 
                  <Chip 
                    label={selectedOrder.deliveryStatus || 'Unassigned'} 
                    color={getDeliveryStatusColor(selectedOrder.deliveryStatus || 'Unassigned')}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                
                {selectedOrder.assignedTo ? (
                  <Typography variant="body2" gutterBottom>
                    Assigned To: {selectedOrder.assignedToName}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Not assigned to any delivery personnel
                  </Typography>
                )}
                
                {selectedOrder.deliveryAcceptedAt && (
                  <Typography variant="body2" gutterBottom>
                    Accepted at: {formatDate(selectedOrder.deliveryAcceptedAt)}
                  </Typography>
                )}
                
                {selectedOrder.deliveryPickedUpAt && (
                  <Typography variant="body2" gutterBottom>
                    Picked up at: {formatDate(selectedOrder.deliveryPickedUpAt)}
                  </Typography>
                )}
                
                {selectedOrder.deliveryCompletedAt && (
                  <Typography variant="body2" gutterBottom>
                    Delivered at: {formatDate(selectedOrder.deliveryCompletedAt)}
                  </Typography>
                )}
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                Order Items
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.title}</TableCell>
                        <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.price * item.quantity)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right"><strong>Subtotal</strong></TableCell>
                      <TableCell align="right">{formatCurrency(selectedOrder.subtotal)}</TableCell>
                    </TableRow>
                    {selectedOrder.deliveryFee > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="right">Delivery Fee</TableCell>
                        <TableCell align="right">{formatCurrency(selectedOrder.deliveryFee)}</TableCell>
                      </TableRow>
                    )}
                    {selectedOrder.tip > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="right">Tip</TableCell>
                        <TableCell align="right">{formatCurrency(selectedOrder.tip)}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={3} align="right"><strong>Total</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(selectedOrder.total)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderDetails}>Close</Button>
          <Stack direction="row" spacing={1}>
            {selectedOrder && !selectedOrder.assignedTo && (
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<DeliveryIcon />}
                onClick={() => {
                  handleCloseOrderDetails();
                  handleOpenAssignDelivery(selectedOrder);
                }}
              >
                Assign Delivery
              </Button>
            )}
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => {
                handleCloseOrderDetails();
                if (selectedOrder) {
                  handleOpenStatusUpdate(selectedOrder);
                }
              }}
            >
              Update Status
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
      
      {/* Update Status Dialog */}
      <Dialog open={statusUpdateOpen} onClose={handleCloseStatusUpdate}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Choose a new status for this order.
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="Placed">Placed</MenuItem>
              <MenuItem value="Confirmed">Confirmed</MenuItem>
              <MenuItem value="Preparing">Preparing</MenuItem>
              <MenuItem value="Ready">Ready</MenuItem>
              <MenuItem value="Out for Delivery">Out for Delivery</MenuItem>
              <MenuItem value="Delivered">Delivered</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusUpdate}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Assign Delivery Dialog */}
      <Dialog open={assignDeliveryOpen} onClose={handleCloseAssignDelivery}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Assign Delivery Personnel</Typography>
            <Tooltip title="Refresh delivery personnel list">
              <IconButton onClick={fetchDeliveryPersonnel} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a delivery person to assign to this order.
          </DialogContentText>
          {deliveryPersonnel.length === 0 ? (
            <>
              <Alert severity="warning" sx={{ mt: 2 }}>
                No delivery personnel available. Please add delivery personnel to the system.
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                This could be due to:
                <ul>
                  <li>No delivery personnel have been added to the system</li>
                  <li>API connection issue between services</li>
                  <li>Authentication issues when fetching personnel</li>
                </ul>
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />} 
                sx={{ mt: 2 }}
                onClick={fetchDeliveryPersonnel}
                fullWidth
              >
                Refresh Personnel List
              </Button>
            </>
          ) : (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="delivery-person-select-label">Delivery Personnel</InputLabel>
              <Select
                labelId="delivery-person-select-label"
                value={selectedDeliveryPersonId}
                label="Delivery Personnel"
                onChange={(e) => setSelectedDeliveryPersonId(e.target.value)}
              >
                {deliveryPersonnel.map((person) => (
                  <MenuItem key={person._id} value={person._id}>
                    {person.name} {person.isMockData ? '(Test Data)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDelivery}>Cancel</Button>
          <Button 
            onClick={handleAssignDelivery} 
            variant="contained" 
            color="primary"
            disabled={!selectedDeliveryPersonId || deliveryPersonnel.length === 0}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
      >
        <DialogTitle>Confirm Order Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this order? This action cannot be undone.
          </DialogContentText>
          {orderToDelete && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Order ID: {orderToDelete._id.substring(orderToDelete._id.length - 8)}</Typography>
              <Typography variant="subtitle2">Total: {formatCurrency(orderToDelete.total)}</Typography>
              <Typography variant="subtitle2">Status: {orderToDelete.status}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Cancel</Button>
          <Button 
            onClick={handleDeleteOrder} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
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

export default RestaurantOrders; 