import React, { useState } from 'react';
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
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import { useCart } from '../../context/CartContext';
import { styled } from '@mui/material/styles';
import CustomerLayout from '../../components/layouts/CustomerLayout';
import { format as formatDate } from 'date-fns';
import PaymentPortal from '../../components/payment/PaymentPortal';

const OrderHistoryItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
}));

const OrderStatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 600,
  backgroundColor: status === 'Placed' ? theme.palette.success.light : theme.palette.info.light,
  color: status === 'Placed' ? theme.palette.success.contrastText : theme.palette.info.contrastText,
}));

const OrderHistory = () => {
  const { cart, updateOrderPayment, removeOrderFromHistory } = useCart();
  
  // Payment portal state
  const [paymentPortalOpen, setPaymentPortalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Sort orders by date (newest first)
  const sortedOrders = [...(cart.orderHistory || [])].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB - dateA;
  });
  
  const handleOpenPaymentPortal = (order) => {
    setSelectedOrder(order);
    setPaymentPortalOpen(true);
  };
  
  const handleClosePaymentPortal = () => {
    setPaymentPortalOpen(false);
  };
  
  const handlePaymentSuccess = (paymentResult) => {
    // Add defensive code to handle undefined paymentResult
    if (!paymentResult) {
      console.error('Payment result is undefined');
      return;
    }
    
    // Update the order payment status in the cart context
    updateOrderPayment(paymentResult.orderId, {
      paymentId: paymentResult.paymentId || `manual_${Date.now()}`,
      amount: paymentResult.amount || 0
    });
  };
  
  // Check if an order has been paid
  const isOrderPaid = (order) => {
    return order.paymentStatus === 'paid';
  };
  
  // Delete order handling
  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    if (orderToDelete) {
      removeOrderFromHistory(orderToDelete.id);
    }
    setDeleteConfirmOpen(false);
  };
  
  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
  };

  return (
    <CustomerLayout>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Order History
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {sortedOrders.length > 0 ? (
          <Box>
            {sortedOrders.map((order, index) => (
              <OrderHistoryItem key={order.id || index} elevation={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Order #{order.id?.substring(order.id.length - 6) || index + 1}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {order.date ? formatDate(new Date(order.date), 'PPp') : 'Just now'}
                    </Typography>
                    <OrderStatusChip 
                      size="small" 
                      label={isOrderPaid(order) ? 'Paid' : order.status || 'Placed'} 
                      status={isOrderPaid(order) ? 'Paid' : order.status || 'Placed'}
                      icon={<CheckCircleIcon />}
                    />
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDeleteClick(order)}
                      title="Delete order"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Delivery Address:
                  </Typography>
                  <Typography variant="body2">
                    {order.deliveryAddress || 'No address provided'}
                  </Typography>
                  {order.additionalInstructions && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>Notes:</strong> {order.additionalInstructions}
                    </Typography>
                  )}
                </Box>
                
                <Accordion defaultExpanded={index === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                      <Typography>
                        Order Details
                      </Typography>
                      <Typography fontWeight="bold">
                        ${order.total}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell align="center">Qty</TableCell>
                            <TableCell align="right">Price</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {order.items.map((item) => (
                            <TableRow key={item._id}>
                              <TableCell>{item.title}</TableCell>
                              <TableCell align="center">{item.quantity}</TableCell>
                              <TableCell align="right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={2} align="right" sx={{ fontWeight: 600 }}>Subtotal:</TableCell>
                            <TableCell align="right">${order.subtotal.toFixed(2)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={2} align="right">Delivery Fee:</TableCell>
                            <TableCell align="right">${order.deliveryFee.toFixed(2)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={2} align="right">Tip:</TableCell>
                            <TableCell align="right">${order.tip.toFixed(2)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={2} align="right" sx={{ fontWeight: 600 }}>Total:</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>${order.total}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        Payment Method: <strong>{order.paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}</strong>
                      </Typography>
                      
                      {order.paymentMethod === 'card' && !isOrderPaid(order) && (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<CreditCardIcon />}
                          onClick={() => handleOpenPaymentPortal(order)}
                        >
                          Pay Now
                        </Button>
                      )}
                      
                      {(order.paymentMethod !== 'card' || isOrderPaid(order)) && (
                        <Chip
                          size="small"
                          icon={<AccessTimeIcon />}
                          label={isOrderPaid(order) ? "Track Order" : "Track Order"}
                          color="primary"
                          clickable
                        />
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </OrderHistoryItem>
            ))}
          </Box>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              You don't have any order history yet.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              href="/customer/dashboard" 
              sx={{ mt: 2 }}
            >
              Browse Menu
            </Button>
          </Paper>
        )}
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-dialog-title"
        >
          <Box sx={{ p: 2, minWidth: 300 }}>
            <Typography variant="h6" id="delete-dialog-title" gutterBottom>
              Delete Order?
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Are you sure you want to delete this order from your history?
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={handleDeleteCancel} color="primary">
                Cancel
              </Button>
              <Button onClick={handleDeleteConfirm} color="error" variant="contained">
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
      </Box>
    </CustomerLayout>
  );
};

export default OrderHistory; 