import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Divider,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Avatar,
  Tooltip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  CreditCard as CreditCardIcon,
  Receipt as ReceiptIcon,
  LocalShipping as LocalShippingIcon,
  LocationOn as LocationOnIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Restaurant as RestaurantIcon,
  DoneAll as DeliveredIcon,
  MoreVert as MoreVertIcon,
  DirectionsBike as BikeIcon
} from '@mui/icons-material';
import { useCart } from '../../context/CartContext';
import { styled } from '@mui/material/styles';
import CustomerLayout from '../../components/layouts/CustomerLayout';
import { format as formatDate } from 'date-fns';
import PaymentPortal from '../../components/payment/PaymentPortal';
import { useNavigate } from 'react-router-dom';
import orderService from '../../services/orderService';

// Styled components
const OrderCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const OrderStatusChip = styled(Chip)(({ theme, status }) => {
  let color = theme.palette.info.light;
  let textColor = theme.palette.info.contrastText;
  
  if (status === 'Placed') {
    color = theme.palette.success.light;
    textColor = theme.palette.success.contrastText;
  } else if (status === 'paid') {
    color = theme.palette.success.light;
    textColor = theme.palette.success.contrastText;
  } else if (status === 'pending') {
    color = theme.palette.warning.light;
    textColor = theme.palette.warning.contrastText;
  }
  
  return {
    fontWeight: 600,
    backgroundColor: color,
    color: textColor,
  };
});

const OrderAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  width: 40,
  height: 40,
}));

const OrderItemImage = styled('img')({
  width: 50,
  height: 50,
  objectFit: 'cover',
  borderRadius: 4,
});

const OrderHistory = () => {
  const { orderHistory, updateOrderPayment, removeOrderFromHistory, fetchOrders, loadUserOrders } = useCart();
  const navigate = useNavigate();
  
  // State variables
  const [paymentPortalOpen, setPaymentPortalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paidOrders, setPaidOrders] = useState(new Set());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [trackOrderOpen, setTrackOrderOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  
  // Add ref to track if orders have been loaded
  const ordersLoaded = useRef(false);
  
  // Fetch orders when component mounts
  useEffect(() => {
    const getOrders = async () => {
      setIsLoading(true);
      try {
        console.log('OrderHistory component: Fetching orders');
        
        // Try fetching orders multiple ways
        await fetchOrders();
        
        // If we didn't get any orders, try the fallback method
        if (!orderHistory || orderHistory.length === 0) {
          console.log('No orders found, trying fallback method');
          const orders = await loadUserOrders();
          console.log('Fallback method returned:', orders?.length || 0, 'orders');
          ordersLoaded.current = true;
        } else {
          console.log('Orders loaded successfully:', orderHistory.length);
          ordersLoaded.current = true;
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setTimeout(() => setIsLoading(false), 800); // Small delay to ensure UI update
      }
    };
    
    getOrders();
    
    // Set up interval to refresh orders periodically
    const refreshInterval = setInterval(() => {
      if (ordersLoaded.current) {
        console.log('Performing background refresh of orders');
        fetchOrders().catch(err => console.error('Background refresh error:', err));
      }
    }, 60000); // Refresh every minute
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Additional effect to monitor orderHistory changes
  useEffect(() => {
    console.log('OrderHistory data updated:', {
      length: orderHistory?.length || 0,
      isArray: Array.isArray(orderHistory),
      firstItem: orderHistory && orderHistory.length > 0 ? orderHistory[0] : null
    });
  }, [orderHistory]);
  
  // Make sure orders are sorted by date (newest first)
  const sortedOrders = [...(orderHistory || [])].sort((a, b) => {
    const dateA = new Date(a.createdAt || Date.now());
    const dateB = new Date(b.createdAt || Date.now());
    return dateB - dateA;
  });
  
  // Handler functions
  const handleOpenPaymentPortal = (order) => {
    setSelectedOrder(order);
    setPaymentPortalOpen(true);
  };
  
  const handleClosePaymentPortal = () => {
    setPaymentPortalOpen(false);
  };
  
  const handlePaymentSuccess = async (paymentResult) => {
    console.log('Payment successful, result:', paymentResult);
    
    if (!selectedOrder) {
      console.error('No selected order for payment');
      return;
    }
    
    try {
      const success = await updateOrderPayment(selectedOrder._id, {
        paymentId: paymentResult.paymentId || `manual_${Date.now()}`,
        amount: paymentResult.amount || selectedOrder.total
      });
      
      if (success) {
        console.log('Payment status updated successfully');
        
        // Add this order to our locally tracked paid orders
        setPaidOrders(prev => new Set([...prev, selectedOrder._id]));
        
        // Close the payment portal
        handleClosePaymentPortal();
        
        // Refresh order list instead of navigating away
        setIsLoading(true);
        setTimeout(async () => {
          await fetchOrders();
          setIsLoading(false);
        }, 500);
      } else {
        console.error('Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };
  
  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (orderToDelete) {
      try {
        console.log('Attempting to delete order:', orderToDelete._id);
        const success = await removeOrderFromHistory(orderToDelete._id);
        
        if (success) {
          console.log('Order deleted successfully');
          // Update the UI by removing the deleted order
          setIsLoading(true);
          // Fetch orders again to update the list
          await fetchOrders();
        } else {
          console.error('Failed to delete order');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
      } finally {
        setDeleteConfirmOpen(false);
        setIsLoading(false);
      }
    } else {
      setDeleteConfirmOpen(false);
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSelectedOrderId(null);
  };

  // Handle track order button click
  const handleTrackOrder = (order) => {
    setTrackingOrder(order);
    setTrackOrderOpen(true);
    refreshOrderStatus(order._id);
  };

  // Close track order dialog
  const handleCloseTrackOrder = () => {
    setTrackOrderOpen(false);
    setTrackingOrder(null);
  };

  // Refresh order status for tracking
  const refreshOrderStatus = async (orderId) => {
    setTrackingLoading(true);
    try {
      const response = await orderService.getOrderById(orderId);
      if (response && response.success) {
        const updatedOrder = response.data;
        setTrackingOrder(updatedOrder);
        
        // Update the order in our local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId ? updatedOrder : order
          )
        );
        
        // Also update the main order history in the cart context
        // Only update the specific order we're tracking
        const updatedOrderHistory = [...(orderHistory || [])].map(order => 
          order._id === orderId ? updatedOrder : order
        );
        
        // Call the context update method if available
        if (typeof fetchOrders === 'function') {
          console.log('Refreshing order history with updated order status');
          fetchOrders(updatedOrderHistory);
        }
      }
    } catch (error) {
      console.error('Error refreshing order status:', error);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Get status step for stepper
  const getOrderStatusStep = (status) => {
    const statusMap = {
      'Placed': 0,
      'Confirmed': 1,
      'Preparing': 2,
      'Ready': 3,
      'Out for Delivery': 4,
      'Delivered': 5,
      'Cancelled': -1
    };
    return statusMap[status] !== undefined ? statusMap[status] : 0;
  };

  // Get delivery status step for stepper
  const getDeliveryStatusStep = (status) => {
    if (!status) return -1; // Handle null or undefined status
    
    const statusMap = {
      'Assigned': 0,
      'Accepted': 1,
      'Picked Up': 2,
      'Delivered': 3,
      'Rejected': -1
    };
    return statusMap[status] !== undefined ? statusMap[status] : 0;
  };

  // Helper functions
  const isOrderPaid = (order) => {
    if (!order) return false;
    return order.paymentStatus === 'paid' || 
           paidOrders.has(order._id) || 
           (order.paymentMethod === 'cash' && order.status === 'Delivered') ||
           (order.paymentId && order.paymentId.length > 0);
  };
  
  const getFormattedDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return formatDate(new Date(dateString), 'PPP p');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  const getTotalAmount = (order) => {
    if (!order) return 0;
    
    if (order.total && order.total > 0) {
      return order.total;
    }
    
    // Calculate from components if total is missing
    const subtotal = order.subtotal || 0;
    const deliveryFee = order.deliveryFee || 0;
    const tip = order.tip || 0;
    return subtotal + deliveryFee + tip;
  };
  
  // Add a function to determine if an order can be deleted
  const canDeleteOrder = (order) => {
    if (!order) return false;
    
    // Cannot delete paid orders
    if (isOrderPaid(order)) return false;
    
    // Cannot delete delivered orders
    if (order.status === 'Delivered') return false;
    
    return true;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <CustomerLayout>
        <Container maxWidth="lg">
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading your order history...
            </Typography>
          </Box>
        </Container>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="medium">
                My Order History
              </Typography>
              <Typography variant="body1" color="text.secondary">
                View and manage all your past orders.
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                setIsLoading(true);
                fetchOrders().finally(() => {
                  setTimeout(() => setIsLoading(false), 1000);
                });
              }}
              startIcon={<RefreshIcon />}
            >
              Refresh Orders
            </Button>
          </Box>
          <Divider sx={{ mb: 4 }} />
          
          {sortedOrders.length > 0 ? (
            <Grid container spacing={3}>
              {sortedOrders.map((order) => (
                <Grid item xs={12} key={order._id}>
                  <OrderCard elevation={3}>
                    <CardHeader
                      avatar={
                        <OrderAvatar>
                          <ReceiptIcon />
                        </OrderAvatar>
                      }
                      title={
                        <Typography variant="h6">
                          Order #{order._id?.substring(0, 8) || 'New'}
                        </Typography>
                      }
                      subheader={
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {getFormattedDate(order.createdAt)}
                          </Typography>
                        </Box>
                      }
                      action={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
                          <OrderStatusChip
                            size="small"
                            label={order.paymentMethod === 'card' 
                              ? (isOrderPaid(order) ? 'Paid' : 'Payment Pending') 
                              : 'Cash on Delivery'}
                            status={isOrderPaid(order) ? 'paid' : 'pending'}
                            icon={isOrderPaid(order) ? <CheckCircleIcon /> : <AccessTimeIcon />}
                          />
                          
                          <Tooltip title={canDeleteOrder(order) ? "Delete Order" : "Paid orders cannot be deleted"}>
                            <span>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteClick(order)}
                                disabled={!canDeleteOrder(order)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      }
                    />
                    
                    <Divider />
                    
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                            <LocationOnIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Delivery Address:
                              </Typography>
                              <Typography variant="body2">
                                {order.deliveryAddress || 'No address provided'}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {order.additionalInstructions && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 2 }}>
                              <InfoIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Special Instructions:
                                </Typography>
                                <Typography variant="body2">
                                  {order.additionalInstructions}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Order Total:
                            </Typography>
                            <Typography variant="h5" color="primary.main" fontWeight="bold">
                              ${getTotalAmount(order).toFixed(2)}
                            </Typography>
                            
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Payment Method:
                              </Typography>
                              <Typography variant="body2">
                                {order.paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Order Status:
                              </Typography>
                              <Typography variant="body2">
                                {order.status || 'Placed'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      <Accordion sx={{ mt: 3 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography fontWeight="medium">
                            Order Details ({(order.items?.length || 0)} items)
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Item</TableCell>
                                  <TableCell align="center">Quantity</TableCell>
                                  <TableCell align="right">Price</TableCell>
                                  <TableCell align="right">Total</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(order.items || []).map((item, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {item.title}
                                      </Box>
                                    </TableCell>
                                    <TableCell align="center">{item.quantity}</TableCell>
                                    <TableCell align="right">${(item.price || 0).toFixed(2)}</TableCell>
                                    <TableCell align="right">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '200px', mb: 1 }}>
                              <Typography variant="body2">Subtotal:</Typography>
                              <Typography variant="body2">${(order.subtotal || 0).toFixed(2)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '200px', mb: 1 }}>
                              <Typography variant="body2">Delivery Fee:</Typography>
                              <Typography variant="body2">${(order.deliveryFee || 0).toFixed(2)}</Typography>
                            </Box>
                            
                            {(order.tip && order.tip > 0) && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '200px', mb: 1 }}>
                                <Typography variant="body2">Tip:</Typography>
                                <Typography variant="body2">${(order.tip || 0).toFixed(2)}</Typography>
                              </Box>
                            )}
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '200px', borderTop: 1, borderColor: 'divider', pt: 1, mt: 1 }}>
                              <Typography variant="subtitle2">Total:</Typography>
                              <Typography variant="subtitle2" fontWeight="bold">${getTotalAmount(order).toFixed(2)}</Typography>
                            </Box>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                      {order.paymentMethod === 'card' && !isOrderPaid(order) && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<CreditCardIcon />}
                          onClick={() => handleOpenPaymentPortal(order)}
                        >
                          Pay Now
                        </Button>
                      )}
                      
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<LocalShippingIcon />}
                        onClick={() => handleTrackOrder(order)}
                      >
                        Track Order
                      </Button>
                    </CardActions>
                  </OrderCard>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" paragraph>
                You don't have any orders yet
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Once you place an order, it will appear here.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/customer/dashboard')}
                sx={{ mt: 2 }}
              >
                Browse Menu
              </Button>
            </Paper>
          )}
        </Box>
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={handleDeleteCancel}
          maxWidth="xs"
          fullWidth
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Delete Order?
            </Typography>
            <Typography variant="body2" paragraph>
              Are you sure you want to delete this order from your history? This action cannot be undone.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button variant="outlined" onClick={handleDeleteCancel}>
                Cancel
              </Button>
              <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </Box>
          </Box>
        </Dialog>
        
        {/* Payment Portal */}
        <PaymentPortal
          open={paymentPortalOpen}
          onClose={handleClosePaymentPortal}
          order={selectedOrder}
          onPaymentSuccess={handlePaymentSuccess}
        />
        
        {/* Track Order Dialog */}
        <Dialog
          open={trackOrderOpen}
          onClose={handleCloseTrackOrder}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Track Your Order
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh Status">
                <IconButton 
                  onClick={() => trackingOrder && refreshOrderStatus(trackingOrder._id)}
                  disabled={trackingLoading}
                >
                  {trackingLoading ? <CircularProgress size={24} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
              <IconButton onClick={handleCloseTrackOrder}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent dividers>
            {trackingOrder && (
              <Box sx={{ mb: 4 }}>
                {/* Order basic info */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h6">
                      Order #{trackingOrder._id.substring(0, 8)}...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Placed on {getFormattedDate(trackingOrder.createdAt)}
                    </Typography>
                  </Box>
                  <Chip 
                    label={trackingOrder.status} 
                    color={
                      trackingOrder.status === 'Delivered' ? 'success' : 
                      trackingOrder.status === 'Cancelled' ? 'error' : 'primary'
                    }
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
                
                {/* Status timeline */}
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                  Order Status
                </Typography>
                
                {trackingOrder.status === 'Cancelled' ? (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    This order has been cancelled.
                  </Alert>
                ) : (
                  <Stepper activeStep={getOrderStatusStep(trackingOrder.status)} orientation="vertical" sx={{ mb: 4 }}>
                    <Step completed={getOrderStatusStep(trackingOrder.status) >= 0}>
                      <StepLabel>Order Placed</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Your order has been received by the restaurant.
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {trackingOrder.createdAt ? getFormattedDate(trackingOrder.createdAt) : 'Processing...'}
                        </Typography>
                      </StepContent>
                    </Step>
                    
                    <Step completed={getOrderStatusStep(trackingOrder.status) >= 1}>
                      <StepLabel>Order Confirmed</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Restaurant has confirmed your order.
                        </Typography>
                      </StepContent>
                    </Step>
                    
                    <Step completed={getOrderStatusStep(trackingOrder.status) >= 2}>
                      <StepLabel>Preparing</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          The restaurant is preparing your food.
                        </Typography>
                      </StepContent>
                    </Step>
                    
                    <Step completed={getOrderStatusStep(trackingOrder.status) >= 3}>
                      <StepLabel>Ready for Pickup</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Your order is ready and waiting for pickup.
                        </Typography>
                      </StepContent>
                    </Step>
                    
                    <Step completed={getOrderStatusStep(trackingOrder.status) >= 4}>
                      <StepLabel>Out for Delivery</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Your order is on its way to you.
                        </Typography>
                      </StepContent>
                    </Step>
                    
                    <Step completed={getOrderStatusStep(trackingOrder.status) >= 5}>
                      <StepLabel>Delivered</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Your order has been delivered. Enjoy!
                        </Typography>
                        {trackingOrder.deliveryCompletedAt && (
                          <Typography variant="caption" color="text.secondary">
                            {getFormattedDate(trackingOrder.deliveryCompletedAt)}
                          </Typography>
                        )}
                      </StepContent>
                    </Step>
                  </Stepper>
                )}
                
                {/* Delivery Personnel Information */}
                {trackingOrder.assignedTo && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Delivery Status
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar>
                        <BikeIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1">
                          {trackingOrder.assignedToName}
                        </Typography>
                        <Chip 
                          label={trackingOrder.deliveryStatus || 'Assigned'} 
                          size="small"
                          color={
                            trackingOrder.deliveryStatus === 'Delivered' ? 'success' : 
                            trackingOrder.deliveryStatus === 'Rejected' ? 'error' : 'info'
                          }
                        />
                      </Box>
                    </Box>
                    
                    <Timeline position="right" sx={{ p: 0, m: 0 }}>
                      <TimelineItem>
                        <TimelineSeparator>
                          <TimelineDot color={getDeliveryStatusStep(trackingOrder?.deliveryStatus) >= 0 ? 'primary' : 'grey'} />
                          <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="body2">Assigned to Delivery</Typography>
                        </TimelineContent>
                      </TimelineItem>
                      
                      <TimelineItem>
                        <TimelineSeparator>
                          <TimelineDot color={getDeliveryStatusStep(trackingOrder?.deliveryStatus) >= 1 ? 'primary' : 'grey'} />
                          <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="body2">Accepted by Delivery Personnel</Typography>
                          {trackingOrder?.deliveryAcceptedAt && (
                            <Typography variant="caption" color="text.secondary">
                              {getFormattedDate(trackingOrder?.deliveryAcceptedAt)}
                            </Typography>
                          )}
                        </TimelineContent>
                      </TimelineItem>
                      
                      <TimelineItem>
                        <TimelineSeparator>
                          <TimelineDot color={getDeliveryStatusStep(trackingOrder?.deliveryStatus) >= 2 ? 'warning' : 'grey'} />
                          <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="body2">Picked Up from Restaurant</Typography>
                          {trackingOrder?.deliveryPickedUpAt && (
                            <Typography variant="caption" color="text.secondary">
                              {getFormattedDate(trackingOrder?.deliveryPickedUpAt)}
                            </Typography>
                          )}
                        </TimelineContent>
                      </TimelineItem>
                      
                      <TimelineItem>
                        <TimelineSeparator>
                          <TimelineDot color={getDeliveryStatusStep(trackingOrder?.deliveryStatus) >= 3 ? 'success' : 'grey'} />
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="body2">Delivered to You</Typography>
                          {trackingOrder?.deliveryCompletedAt && (
                            <Typography variant="caption" color="text.secondary">
                              {getFormattedDate(trackingOrder?.deliveryCompletedAt)}
                            </Typography>
                          )}
                        </TimelineContent>
                      </TimelineItem>
                    </Timeline>
                  </Box>
                )}
                
                {/* Delivery information */}
                <Typography variant="subtitle1" gutterBottom>
                  Delivery Address
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="body2">
                    {trackingOrder.deliveryAddress}
                  </Typography>
                </Paper>
                
                {/* Order items */}
                <Typography variant="subtitle1" gutterBottom>
                  Order Items
                </Typography>
                <Paper variant="outlined" sx={{ mb: 3 }}>
                  <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                    {trackingOrder.items.map((item, index) => (
                      <Box
                        component="li"
                        key={index}
                        sx={{
                          p: 2,
                          borderBottom: index < trackingOrder.items.length - 1 ? 1 : 0,
                          borderColor: 'divider',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1">
                            {item.quantity} × {item.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          ${(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
                
                {/* Order total */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '200px' }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">${trackingOrder.subtotal.toFixed(2)}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '200px' }}>
                    <Typography variant="body2">Delivery Fee:</Typography>
                    <Typography variant="body2">${(trackingOrder.deliveryFee || 0).toFixed(2)}</Typography>
                  </Box>
                  
                  {trackingOrder.tip > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '200px' }}>
                      <Typography variant="body2">Tip:</Typography>
                      <Typography variant="body2">${(trackingOrder.tip || 0).toFixed(2)}</Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    width: '200px',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    pt: 1,
                    mt: 1
                  }}>
                    <Typography variant="subtitle2">Total:</Typography>
                    <Typography variant="subtitle2" fontWeight="bold">
                      ${getTotalAmount(trackingOrder).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button
              onClick={() => trackingOrder && refreshOrderStatus(trackingOrder._id)}
              startIcon={<RefreshIcon />}
              disabled={trackingLoading}
            >
              Refresh Status
            </Button>
            <Button variant="contained" onClick={handleCloseTrackOrder}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </CustomerLayout>
  );
};

export default OrderHistory; 