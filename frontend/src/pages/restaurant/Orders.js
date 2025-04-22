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
  Snackbar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Info as InfoIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  RestaurantMenu as PrepareIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import orderService from '../../services/orderService';

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

const RestaurantOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getRestaurantOrders();
      setOrders(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching restaurant orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrders();
  }, []);
  
  const handleRefresh = () => {
    fetchOrders();
  };
  
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };
  
  const handleCloseOrderDetails = () => {
    setOrderDetailsOpen(false);
    setSelectedOrder(null);
  };
  
  const handleOpenStatusUpdate = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusUpdateOpen(true);
  };
  
  const handleCloseStatusUpdate = () => {
    setStatusUpdateOpen(false);
    setSelectedOrder(null);
    setNewStatus('');
  };
  
  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    
    try {
      await orderService.updateOrderStatus(selectedOrder._id, newStatus);
      
      // Update local state
      setOrders(orders.map(order => 
        order._id === selectedOrder._id 
          ? { ...order, status: newStatus } 
          : order
      ));
      
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
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
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
      
      {orders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No orders found. Orders will appear here once customers place them.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Order Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order._id.substring(0, 8)}...</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={order.paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery'} 
                      color={order.paymentMethod === 'card' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)} 
                      color={getPaymentStatusColor(order.paymentStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={order.status} 
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="View Details">
                        <IconButton onClick={() => handleViewOrderDetails(order)} size="small">
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Update Status">
                        <IconButton onClick={() => handleOpenStatusUpdate(order)} size="small">
                          {order.status === 'Placed' ? <CheckCircleIcon /> :
                           order.status === 'Confirmed' ? <PrepareIcon /> :
                           order.status === 'Preparing' || order.status === 'Ready' ? <ShippingIcon /> :
                           <InfoIcon />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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