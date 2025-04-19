import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Grid,
  Divider,
  IconButton,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import { 
  Add, 
  Remove, 
  Delete as DeleteIcon, 
  ExpandMore as ExpandMoreIcon, 
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useCart } from '../../context/CartContext';
import { styled } from '@mui/material/styles';
import CustomerLayout from '../../components/layouts/CustomerLayout';
import { format as formatDate } from 'date-fns';

const OrderSummaryPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const TotalRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 0),
  borderTop: `1px solid ${theme.palette.divider}`,
  marginTop: theme.spacing(2),
}));

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

const steps = ['Review Order', 'Delivery Details', 'Payment', 'Confirmation'];

// Key for storing checkout state in localStorage
const CHECKOUT_STATE_KEY = 'checkout_state';

const Checkout = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, addToOrderHistory } = useCart();
  
  // Initialize state from localStorage if available
  const [activeStep, setActiveStep] = useState(() => {
    const savedState = localStorage.getItem(CHECKOUT_STATE_KEY);
    if (savedState) {
      const { step } = JSON.parse(savedState);
      return step || 0;
    }
    return 0;
  });
  
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    const savedState = localStorage.getItem(CHECKOUT_STATE_KEY);
    if (savedState) {
      const { address } = JSON.parse(savedState);
      return address || '';
    }
    return '';
  });
  
  const [additionalInstructions, setAdditionalInstructions] = useState(() => {
    const savedState = localStorage.getItem(CHECKOUT_STATE_KEY);
    if (savedState) {
      const { instructions } = JSON.parse(savedState);
      return instructions || '';
    }
    return '';
  });
  
  const [paymentMethod, setPaymentMethod] = useState(() => {
    const savedState = localStorage.getItem(CHECKOUT_STATE_KEY);
    if (savedState) {
      const { payment } = JSON.parse(savedState);
      return payment || '';
    }
    return '';
  });
  
  const [orderComplete, setOrderComplete] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  // Save checkout state whenever it changes
  useEffect(() => {
    const checkoutState = {
      step: activeStep,
      address: deliveryAddress,
      instructions: additionalInstructions,
      payment: paymentMethod
    };
    
    localStorage.setItem(CHECKOUT_STATE_KEY, JSON.stringify(checkoutState));
  }, [activeStep, deliveryAddress, additionalInstructions, paymentMethod]);
  
  // Clear checkout state when order is complete
  useEffect(() => {
    if (orderComplete) {
      localStorage.removeItem(CHECKOUT_STATE_KEY);
    }
  }, [orderComplete]);

  // Calculate totals
  const subtotal = cart.total || 0;
  const deliveryFee = 4.99;
  const tipAmount = ((subtotal * (cart.tip?.percentage || 0)) / 100) || 0;
  const totalAmount = (parseFloat(subtotal) + parseFloat(deliveryFee) + parseFloat(tipAmount)).toFixed(2);

  const handleNext = () => {
    if (activeStep === 0 && cart.items.length === 0) {
      setAlertOpen(true);
      return;
    }
    
    if (activeStep === 1 && !deliveryAddress.trim()) {
      setAlertOpen(true);
      return;
    }

    if (activeStep === 2 && !paymentMethod) {
      setAlertOpen(true);
      return;
    }
    
    if (activeStep === 2) {
      // Save order before moving to confirmation
      const orderDetails = {
        items: [...cart.items],
        subtotal,
        deliveryFee,
        tip: tipAmount,
        total: totalAmount,
        deliveryAddress,
        additionalInstructions,
        paymentMethod
      };
      
      addToOrderHistory(orderDetails);
      setOrderComplete(true);
      
      // Clear cart after successful checkout
      setTimeout(() => {
        clearCart();
      }, 1000);
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  // Render different content based on active step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <OrderReview 
            cart={cart} 
            handleQuantityChange={handleQuantityChange} 
            removeFromCart={removeFromCart} 
          />
        );
      case 1:
        return (
          <DeliveryDetails 
            deliveryAddress={deliveryAddress} 
            setDeliveryAddress={setDeliveryAddress}
            additionalInstructions={additionalInstructions}
            setAdditionalInstructions={setAdditionalInstructions}
          />
        );
      case 2:
        return (
          <PaymentDetails 
            paymentMethod={paymentMethod} 
            setPaymentMethod={setPaymentMethod} 
          />
        );
      case 3:
        return (
          <OrderConfirmation 
            orderComplete={orderComplete} 
            orderHistory={cart.orderHistory || []}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <CustomerLayout>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Checkout
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {getStepContent(activeStep)}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <OrderSummary 
              cart={cart} 
              subtotal={subtotal} 
              deliveryFee={deliveryFee} 
              tipAmount={tipAmount} 
              totalAmount={totalAmount} 
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={activeStep === 3}
              >
                {activeStep === 2 ? 'Place Order' : 'Next'}
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        <Snackbar 
          open={alertOpen} 
          autoHideDuration={6000} 
          onClose={() => setAlertOpen(false)}
        >
          <Alert 
            onClose={() => setAlertOpen(false)} 
            severity="warning" 
            sx={{ width: '100%' }}
          >
            {activeStep === 0 ? 'Your cart is empty. Please add items to proceed.' : 
             activeStep === 1 ? 'Please enter your delivery address to proceed.' :
             'Please select a payment method to proceed.'}
          </Alert>
        </Snackbar>
      </Box>
    </CustomerLayout>
  );
};

// Order Review Component
const OrderReview = ({ cart, handleQuantityChange, removeFromCart }) => {
  if (!cart.items || cart.items.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          Your cart is empty. Please add items to your cart before checkout.
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
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell align="center">Quantity</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cart.items.map((item) => (
            <TableRow key={item._id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    component="img" 
                    src={item.imageUrl || 'https://via.placeholder.com/60x60?text=Food'} 
                    alt={item.title}
                    sx={{ width: 60, height: 60, borderRadius: 1, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="subtitle2">{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description?.substring(0, 60)}
                      {item.description?.length > 60 ? '...' : ''}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                  <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell align="right">${(item.price || 0).toFixed(2)}</TableCell>
              <TableCell align="right">${((item.price || 0) * item.quantity).toFixed(2)}</TableCell>
              <TableCell align="center">
                <IconButton onClick={() => removeFromCart(item._id)} size="small">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Order Summary Component
const OrderSummary = ({ cart, subtotal, deliveryFee, tipAmount, totalAmount }) => {
  return (
    <OrderSummaryPaper>
      <Typography variant="h6" gutterBottom>
        Order Summary
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        {cart.items && cart.items.map((item) => (
          <Box 
            key={item._id} 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mb: 1 
            }}
          >
            <Typography variant="body2">
              {item.quantity} x {item.title}
            </Typography>
            <Typography variant="body2">
              ${((item.price || 0) * item.quantity).toFixed(2)}
            </Typography>
          </Box>
        ))}
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Subtotal</Typography>
        <Typography variant="body2">${subtotal.toFixed(2)}</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Delivery Fee</Typography>
        <Typography variant="body2">${deliveryFee.toFixed(2)}</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Tip</Typography>
        <Typography variant="body2">${tipAmount.toFixed(2)}</Typography>
      </Box>
      
      <TotalRow>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Total
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          ${totalAmount}
        </Typography>
      </TotalRow>
    </OrderSummaryPaper>
  );
};

// Delivery Details Component
const DeliveryDetails = ({ deliveryAddress, setDeliveryAddress, additionalInstructions, setAdditionalInstructions }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Delivery Information
      </Typography>
      
      <TextField
        label="Delivery Address"
        variant="outlined"
        fullWidth
        value={deliveryAddress}
        onChange={(e) => setDeliveryAddress(e.target.value)}
        helperText="Enter your complete delivery address"
        placeholder="123 Main St, Apartment 4B, City, State, ZIP"
        required
        sx={{ mb: 2 }}
      />
      
      <TextField
        label="Additional Instructions"
        variant="outlined"
        fullWidth
        multiline
        rows={3}
        value={additionalInstructions}
        onChange={(e) => setAdditionalInstructions(e.target.value)}
        placeholder="Special delivery instructions, landmarks, etc."
      />
    </Paper>
  );
};

// Payment Details Component
const PaymentDetails = ({ paymentMethod, setPaymentMethod }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Payment Method
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Button 
            variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
            onClick={() => setPaymentMethod('cash')}
            fullWidth
            sx={{ justifyContent: 'flex-start', py: 2 }}
          >
            Cash on Delivery
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Button 
            variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
            onClick={() => setPaymentMethod('card')}
            fullWidth
            sx={{ justifyContent: 'flex-start', py: 2 }}
          >
            Credit/Debit Card
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Order Confirmation Component
const OrderConfirmation = ({ orderComplete, orderHistory }) => {
  const latestOrder = orderHistory.length > 0 ? orderHistory[orderHistory.length - 1] : null;
  
  // Sort orders by date (newest first)
  const sortedOrders = [...orderHistory].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB - dateA;
  });
  
  return (
    <Box>
      <Paper sx={{ p: 3, textAlign: 'center', mb: 4 }}>
        {orderComplete ? (
          <>
            <CheckCircleIcon sx={{ fontSize: 60, color: 'green', mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ color: 'green' }}>
              Order Placed Successfully!
            </Typography>
            <Typography variant="body1" paragraph>
              Your order has been received and is being processed.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              You will receive a confirmation email with your order details.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              href="/customer/dashboard" 
              sx={{ mt: 3 }}
            >
              Continue Shopping
            </Button>
          </>
        ) : (
          <Typography variant="body1">
            Please review your order and complete the checkout process.
          </Typography>
        )}
      </Paper>
      
      <Typography variant="h6" gutterBottom>
        Order History ({sortedOrders.length})
      </Typography>
      
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
                    label={order.status || 'Placed'} 
                    status={order.status || 'Placed'}
                    icon={<CheckCircleIcon />}
                  />
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
                    <Chip
                      size="small"
                      icon={<AccessTimeIcon />}
                      label="Track Order"
                      color="primary"
                      clickable
                    />
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
        </Paper>
      )}
    </Box>
  );
};

export default Checkout; 