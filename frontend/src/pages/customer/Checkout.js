import React, { useState, useEffect, useRef } from 'react';
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
  Chip,
  Dialog,
  List,
  ListItem,
  Container,
  ListItemText
} from '@mui/material';
import { 
  Add, 
  Remove, 
  Delete as DeleteIcon, 
  ExpandMore as ExpandMoreIcon, 
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import { useCart } from '../../context/CartContext';
import { styled } from '@mui/material/styles';
import CustomerLayout from '../../components/layouts/CustomerLayout';
import { format as formatDate } from 'date-fns';
import PaymentPortal from '../../components/payment/PaymentPortal';
import { useNavigate } from 'react-router-dom';
import addressService from '../../services/addressService';
import useAuth from '../../hooks/useAuth';

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

// Replace makeStyles with styled components
const OrderHistoryItemContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
}));

const OrderHistoryContent = styled(Box)({
  flex: 1,
});

const OrderActionsContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
});

const Checkout = () => {
  const { 
    cart, 
    orderHistory, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    addToOrderHistory, 
    updateOrderPayment, 
    removeOrderFromHistory, 
    fetchOrders 
  } = useCart();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // State for checkout process
  const [activeStep, setActiveStep] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [userAddresses, setUserAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  
  // Add a ref to track if we've already fetched orders
  const ordersInitiallyFetched = useRef(false);

  // Add state to track paid orders
  const [paidOrders, setPaidOrders] = useState(new Set());

  // Log state changes for debugging
  useEffect(() => {
    console.log('Payment method updated:', paymentMethod);
  }, [paymentMethod]);

  useEffect(() => {
    console.log('Active step updated to:', activeStep);
    // IMPORTANT: If active step is 3, always ensure orderComplete is true
    if (activeStep === 3 && !orderComplete) {
      console.log('Forcing orderComplete to true since we are on step 3');
      setOrderComplete(true);
    }
  }, [activeStep, orderComplete]);

  // Fetch user's saved addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      setIsLoadingAddresses(true);
      try {
        // First, check if there's a default address from the user profile
        if (currentUser?.defaultDeliveryAddress && !deliveryAddress) {
          setDeliveryAddress(currentUser.defaultDeliveryAddress);
        }
        
        // Then fetch all addresses from the API
        const response = await addressService.getUserAddresses();
        if (response.data && response.data.success) {
          setUserAddresses(response.data.data);
          
          // If we don't have an address set already, use the default one from the API
          if (response.data.data.length > 0 && !deliveryAddress) {
            const defaultAddress = response.data.data.find(addr => addr.isDefault) || response.data.data[0];
            setDeliveryAddress(defaultAddress.fullAddress);
          }
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        // Even if API fails, try to use the address from user profile
        if (currentUser?.defaultDeliveryAddress && !deliveryAddress) {
          setDeliveryAddress(currentUser.defaultDeliveryAddress);
        }
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [currentUser, deliveryAddress]);

  // Refresh order history when needed - fix infinite loop
  useEffect(() => {
    if (activeStep === 3 && !ordersInitiallyFetched.current) { // Confirmation step
      console.log('On confirmation step, fetching orders for the first time');
      // Mark as fetched so we don't trigger infinite loop
      ordersInitiallyFetched.current = true;
      
      // Initial fetch
      fetchOrders();
      
      // One additional delayed fetch to ensure latest data
      const timer = setTimeout(() => {
        console.log('One final fetch to ensure latest data');
        fetchOrders();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [activeStep]); // Remove fetchOrders from dependency array

  // Handle next step logic
  const handleNext = () => {
    console.log('Current step:', activeStep, 'Payment method:', paymentMethod); // Debug log
    
    // Validation for each step
    if (activeStep === 0) {
      // Cart must not be empty
      if (!cart.items || cart.items.length === 0) {
        setAlertOpen(true);
        return;
      }
    } else if (activeStep === 1) {
      // Delivery address is required
      if (!deliveryAddress) {
        setAlertOpen(true);
        return;
      }
    } else if (activeStep === 2) {
      // Payment method is required
      console.log('Validating payment method:', paymentMethod); // Debug log
      if (!paymentMethod || paymentMethod === '') {
        console.log('Payment method not selected, showing alert'); // Debug log
        setAlertOpen(true);
        return;
      }

      // Create order at this point
      handleCreateOrder();
      return; // handleCreateOrder will advance to next step if successful
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Create order from cart
  const handleCreateOrder = async () => {
    // Reset the orders fetch flag to ensure we get fresh data
    ordersInitiallyFetched.current = false;
    
    // Log debug info
    console.log('DEBUG: Creating order with payment method:', paymentMethod);
    
    // Calculate the correct total amount
    const subtotalAmount = cart.total || 0;
    const deliveryFeeAmount = cart.delivery?.fee || 0;
    const tipAmount = cart.tip?.amount || 0;
    const totalAmount = subtotalAmount + deliveryFeeAmount + tipAmount;
    
    // Store the cart state in localStorage for recovery if needed
    try {
      localStorage.setItem('lastOrderCart', JSON.stringify({
        items: cart.items,
        subtotal: subtotalAmount,
        deliveryFee: deliveryFeeAmount,
        tip: tipAmount,
        total: totalAmount
      }));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
    
    const orderData = {
      items: cart.items,
      subtotal: subtotalAmount,
      deliveryFee: deliveryFeeAmount,
      tip: tipAmount,
      total: totalAmount,
      deliveryAddress: deliveryAddress,
      additionalInstructions: additionalInstructions || '',
      paymentMethod: paymentMethod
    };

    try {
      // Create the order through the API
      console.log('Creating order with data:', orderData);
      const newOrder = await addToOrderHistory(orderData);
      
      if (newOrder) {
        console.log('Order created successfully:', newOrder);
        setCurrentOrderId(newOrder._id);
      } else {
        console.log('Order created but no data returned');
      }
      
      // Mark order as complete
      setOrderComplete(true);
      
      // IMPORTANT: Force navigation to confirmation step
      console.log('Forcing navigation to confirmation step');
      window.setTimeout(() => {
        setActiveStep(3);
        console.log('Active step set to:', 3);
      }, 100);
    } catch (error) {
      console.error('Error creating order:', error);
      setAlertOpen(true);
    }
  };

  // Handle going back
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Update item quantity
  const handleQuantityChange = (itemId, newQuantity) => {
    updateQuantity(itemId, newQuantity);
  };

  // Render appropriate step content
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
            userAddresses={userAddresses}
            isLoadingAddresses={isLoadingAddresses}
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
            orderHistory={orderHistory}
            currentOrderId={currentOrderId}
            updateOrderPayment={updateOrderPayment}
            removeOrderFromHistory={removeOrderFromHistory}
            fetchOrders={fetchOrders}
            cart={cart}
            paymentMethod={paymentMethod}
            deliveryAddress={deliveryAddress}
            paidOrders={paidOrders}
            setPaidOrders={setPaidOrders}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  // Calculate order summary values
  const subtotal = cart.total || 0;
  const deliveryFee = cart.delivery?.fee || 0;
  const tipAmount = cart.tip?.amount || 0;
  const totalAmount = subtotal + deliveryFee + tipAmount;

  return (
    <CustomerLayout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
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
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8} lg={8}>
            {getStepContent(activeStep)}
          </Grid>
          
          <Grid item xs={12} md={4} lg={4}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: '100px' } }}>
              <OrderSummary
                cart={cart}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                tipAmount={tipAmount}
                totalAmount={totalAmount}
                isConfirmationStep={activeStep === 3}
                orderData={
                  activeStep === 3 ? (
                    // Find the matching order first
                    orderHistory && currentOrderId && orderHistory.find(o => o._id === currentOrderId) 
                    ? {
                        // Use actual order data if found
                        subtotal: orderHistory.find(o => o._id === currentOrderId).subtotal || subtotal,
                        deliveryFee: orderHistory.find(o => o._id === currentOrderId).deliveryFee || deliveryFee,
                        tip: orderHistory.find(o => o._id === currentOrderId).tip || tipAmount,
                        total: orderHistory.find(o => o._id === currentOrderId).total || totalAmount
                      }
                    : orderComplete ? 
                      // If order was just placed but not yet in history, use values from cart 
                      {
                        subtotal,
                        deliveryFee,
                        tip: tipAmount,
                        total: totalAmount
                      } 
                    : null
                  ) : null
                }
              />
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={activeStep === 0 ? () => navigate('/customer/dashboard') : handleBack}
                  sx={{ mr: 1 }}
                >
                  {activeStep === 0 ? 'Back to Menu' : 'Back'}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={activeStep === 3 ? () => navigate('/customer/dashboard') : handleNext}
                  disabled={
                    (activeStep === 0 && (!cart.items || cart.items.length === 0)) ||
                    (activeStep === 1 && !deliveryAddress) ||
                    (activeStep === 2 && (!paymentMethod || paymentMethod === ''))
                  }
                >
                  {activeStep === steps.length - 2 ? 'Place Order' : activeStep === steps.length - 1 ? 'Done' : 'Next'}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Snackbar 
          open={alertOpen} 
          autoHideDuration={6000} 
          onClose={() => setAlertOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setAlertOpen(false)} 
            severity="error" 
            sx={{ width: '100%' }}
          >
            {activeStep === 0 ? 'Please add items to your cart before proceeding.' : 
             activeStep === 1 ? 'Please enter your delivery address.' : 
             activeStep === 2 ? 'Please select a payment method (Credit/Debit Card or Cash on Delivery).' : 
             'There was an error processing your order. Please try again.'}
          </Alert>
        </Snackbar>
      </Container>
    </CustomerLayout>
  );
};

// Order review component
const OrderReview = ({ cart, handleQuantityChange, removeFromCart }) => {
  return (
    <Paper sx={{ p: 3, mb: 3, width: '100%', overflowX: 'hidden' }}>
      <Typography variant="h6" gutterBottom>
        Review Your Order
      </Typography>
      
      {(!cart.items || cart.items.length === 0) ? (
        <Typography variant="body1" color="text.secondary">
          Your cart is empty. Please add items to proceed.
        </Typography>
      ) : (
        <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="80px">Image</TableCell>
                <TableCell width="30%">Item</TableCell>
                <TableCell align="right" width="15%">Price</TableCell>
                <TableCell align="right" width="20%">Quantity</TableCell>
                <TableCell align="right" width="15%">Total</TableCell>
                <TableCell align="right" width="10%">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cart.items.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    {item.image ? (
                      <Box
                        component="img"
                        src={item.image}
                        alt={item.title}
                        sx={{
                          width: 60,
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 1
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          bgcolor: 'grey.200',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          No img
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{item.title}</Typography>
                  </TableCell>
                  <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleQuantityChange(item._id, Math.max(1, item.quantity - 1))}
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
                  <TableCell align="right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      color="error" 
                      size="small" 
                      onClick={() => removeFromCart(item._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

// Order summary component
const OrderSummary = ({ 
  cart, 
  subtotal, 
  deliveryFee, 
  tipAmount, 
  totalAmount, 
  isConfirmationStep,
  orderData
}) => {
  // Use order data if available in confirmation step
  const displaySubtotal = isConfirmationStep && orderData ? orderData.subtotal : subtotal;
  const displayDeliveryFee = isConfirmationStep && orderData ? orderData.deliveryFee : deliveryFee;
  const displayTip = isConfirmationStep && orderData ? orderData.tip : tipAmount;
  const displayTotal = isConfirmationStep && orderData ? orderData.total : totalAmount;
  
  // Add console log to debug values
  React.useEffect(() => {
    if (isConfirmationStep) {
      console.log('Order Summary Data:', {
        orderData,
        displaySubtotal,
        displayDeliveryFee,
        displayTip,
        displayTotal
      });
    }
  }, [isConfirmationStep, orderData, displaySubtotal, displayDeliveryFee, displayTip, displayTotal]);

  return (
    <OrderSummaryPaper elevation={3}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Order Summary
      </Typography>
      
      <Box sx={{ my: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body1">Subtotal</Typography>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>${displaySubtotal.toFixed(2)}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body1">Delivery Fee</Typography>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {cart.delivery?.free && !isConfirmationStep ? (
              <span style={{ color: 'green' }}>FREE</span>
            ) : (
              `$${displayDeliveryFee.toFixed(2)}`
            )}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body1">Tip</Typography>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>${displayTip.toFixed(2)}</Typography>
        </Box>
        
        <TotalRow>
          <Typography variant="h6">Total</Typography>
          <Typography variant="h6" color="primary.main">${displayTotal.toFixed(2)}</Typography>
        </TotalRow>
      </Box>
    </OrderSummaryPaper>
  );
};

// Delivery details component
const DeliveryDetails = ({ 
  deliveryAddress, 
  setDeliveryAddress, 
  userAddresses, 
  isLoadingAddresses,
  additionalInstructions, 
  setAdditionalInstructions 
}) => {
  const { currentUser } = useAuth();
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // Pre-populate with default address when component mounts
  useEffect(() => {
    const fetchDefaultAddress = async () => {
      try {
        // Try to get default address from the address service
        const defaultAddress = await addressService.getDefaultAddress();
        
        if (defaultAddress && !deliveryAddress) {
          setDeliveryAddress(defaultAddress.fullAddress || defaultAddress.address);
        }
        // If no default address found from address service but user has a default delivery address
        else if (currentUser?.defaultDeliveryAddress && !deliveryAddress) {
          setDeliveryAddress(currentUser.defaultDeliveryAddress);
        }
      } catch (error) {
        console.error('Error fetching default address:', error);
        // Fallback to user's stored address if api call fails
        if (currentUser?.defaultDeliveryAddress && !deliveryAddress) {
          setDeliveryAddress(currentUser.defaultDeliveryAddress);
        }
      }
    };
    
    fetchDefaultAddress();
  }, [currentUser, deliveryAddress, setDeliveryAddress]);

  const handleAddressChange = (e) => {
    setDeliveryAddress(e.target.value);
  };

  return (
    <Paper sx={{ p: 3, mb: 3, width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Delivery Details
      </Typography>
      
      <Box sx={{ my: 2 }}>
        {userAddresses && userAddresses.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Your Saved Addresses
            </Typography>
            <Box sx={{ maxHeight: '200px', overflowY: 'auto', pr: 1 }}>
              <List>
                {userAddresses.map((address) => (
                  <ListItem 
                    key={address._id}
                    sx={{ 
                      border: '1px solid', 
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      backgroundColor: deliveryAddress === address.fullAddress ? 'action.selected' : 'transparent'
                    }}
                    onClick={() => setDeliveryAddress(address.fullAddress)}
                  >
                    <ListItemText 
                      primary={address.fullAddress}
                      secondary={address.label || ''}
                    />
                    {address.isDefault && (
                      <Chip size="small" label="Default" color="primary" variant="outlined" />
                    )}
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        )}
        
        <Typography variant="subtitle1" gutterBottom>
          Delivery Address
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={deliveryAddress}
          onChange={handleAddressChange}
          placeholder="Enter your full address"
          required
          sx={{ mb: 3 }}
        />
        
        <Typography variant="subtitle1" gutterBottom>
          Additional Instructions (Optional)
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          variant="outlined"
          value={additionalInstructions}
          onChange={(e) => setAdditionalInstructions(e.target.value)}
          placeholder="E.g., Ring doorbell, call upon arrival, etc."
        />
      </Box>
    </Paper>
  );
};

// Payment details component
const PaymentDetails = ({ paymentMethod, setPaymentMethod }) => {
  console.log('Current payment method:', paymentMethod); // Debug log
  
  const handlePaymentMethodSelect = (method) => {
    console.log('Setting payment method to:', method); // Debug log
    setPaymentMethod(method);
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3, width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Payment Method
      </Typography>
      
      <Box sx={{ my: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Select Payment Method
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
          <Button
            variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
            onClick={() => handlePaymentMethodSelect('card')}
            startIcon={<CreditCardIcon />}
            fullWidth
            size="large"
            sx={{ py: 1.5 }}
          >
            Credit/Debit Card
          </Button>
          
          <Button
            variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
            onClick={() => handlePaymentMethodSelect('cash')}
            startIcon={<CreditCardIcon />}
            fullWidth
            size="large"
            sx={{ py: 1.5 }}
          >
            Cash on Delivery
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

// Order confirmation component
const OrderConfirmation = ({ 
  orderComplete, 
  orderHistory, 
  currentOrderId,
  updateOrderPayment, 
  removeOrderFromHistory,
  fetchOrders,
  cart,
  paymentMethod,
  deliveryAddress,
  paidOrders,
  setPaidOrders
}) => {
  const [openPaymentPortal, setOpenPaymentPortal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const manualFetchRequested = useRef(false);
  const portalOpened = useRef(false);
  const [preservedOrderData, setPreservedOrderData] = useState(null);

  // Load indicators to avoid infinite loops
  useEffect(() => {
    // This ensures we don't show loading forever if there's an issue
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Log the current state for debugging
  useEffect(() => {
    console.log('OrderConfirmation component - Current state:');
    console.log('- orderComplete:', orderComplete);
    console.log('- currentOrderId:', currentOrderId);
    console.log('- orderHistory length:', orderHistory?.length);
    
    // Reset loading once we have data
    if (orderHistory && orderHistory.length > 0) {
      setIsLoading(false);
    }
  }, [orderComplete, currentOrderId, orderHistory]);

  // Manual fetch function that prevents multiple rapid calls
  const safelyFetchOrders = () => {
    if (!manualFetchRequested.current) {
      manualFetchRequested.current = true;
      console.log('Manual safe fetch requested');
      fetchOrders();
      
      // Reset the flag after a delay
      setTimeout(() => {
        manualFetchRequested.current = false;
      }, 2000);
    } else {
      console.log('Fetch already in progress, ignoring additional request');
    }
  };

  // Find the current order
  const currentOrder = currentOrderId 
    ? orderHistory?.find(order => order._id === currentOrderId) 
    : null;
  
  // Debug logs to find where orders are getting lost
  useEffect(() => {
    if (currentOrderId) {
      console.log('Looking for order with ID:', currentOrderId);
      if (orderHistory && orderHistory.length > 0) {
        console.log('Available order IDs:', orderHistory.map(o => o._id));
        const found = orderHistory.find(order => order._id === currentOrderId);
        console.log('Found order?', found ? 'Yes' : 'No');
        
        if (!found) {
          // Try to force a fetch since we can't find the order
          console.log('Order not found in history, attempting fetch');
          safelyFetchOrders();
        }
      }
    }
  }, [currentOrderId, orderHistory]);
  
  // Auto-open payment portal if the order was just created with card payment
  useEffect(() => {
    if (portalOpened.current) {
      return; // Don't try to open again if we've already tried
    }
    
    console.log('Checking if payment portal should open');
    
    // If no specific order but order complete is true, try to use the most recent order
    if (!currentOrder && orderComplete && orderHistory && orderHistory.length > 0) {
      const mostRecentOrder = orderHistory[0]; // Assuming orderHistory is sorted with newest first
      console.log('Using most recent order:', mostRecentOrder?._id);
      
      if (mostRecentOrder && mostRecentOrder.paymentMethod === 'card' && 
          mostRecentOrder.paymentStatus !== 'paid') {
        console.log('Opening payment portal for recent order');
        portalOpened.current = true;
        handleOpenPaymentPortal(mostRecentOrder);
      }
    } else if (currentOrder && currentOrder.paymentMethod === 'card' && 
              currentOrder.paymentStatus !== 'paid' && orderComplete) {
      console.log('Opening payment portal for current order');
      portalOpened.current = true;
      handleOpenPaymentPortal(currentOrder);
    }
  }, [currentOrder, orderComplete, orderHistory?.length]); // Only depend on array length

  // Try to recover cart information from localStorage if needed
  useEffect(() => {
    // Only do this if we need a fallback
    if (currentOrderId && orderComplete && (!currentOrder || getOrderTotal(currentOrder) === 0)) {
      try {
        const savedCartData = localStorage.getItem('lastOrderCart');
        if (savedCartData) {
          const parsedCart = JSON.parse(savedCartData);
          console.log('Recovered cart data from localStorage:', parsedCart);
          setPreservedOrderData(parsedCart);
        }
      } catch (err) {
        console.error('Failed to recover cart from localStorage:', err);
      }
    }
  }, [currentOrderId, orderComplete, currentOrder]);

  const handleOpenPaymentPortal = (order) => {
    console.log('Opening payment portal for order:', order);
    setSelectedOrder(order);
    setOpenPaymentPortal(true);
  };

  const handleClosePaymentPortal = () => {
    setOpenPaymentPortal(false);
  };

  const handlePaymentSuccess = async (paymentResult) => {
    console.log('Payment successful, result:', paymentResult);
    
    if (!selectedOrder) {
      console.error('No selected order for payment');
      return;
    }
    
    // Ensure we have a valid amount
    const paymentAmount = paymentResult.amount || getOrderTotal(selectedOrder);
    
    // Update order payment status
    try {
      const success = await updateOrderPayment(selectedOrder._id, {
        paymentId: paymentResult.paymentId || `manual_${Date.now()}`,
        amount: paymentAmount
      });
      
      if (success) {
        console.log('Payment status updated successfully');
        
        // Add this order to our locally tracked paid orders
        setPaidOrders(prev => new Set([...prev, selectedOrder._id]));
        
        // Close the payment portal
        handleClosePaymentPortal();
        
        // Force refresh orders after payment is completed
        setTimeout(() => {
          safelyFetchOrders();
        }, 500);
      } else {
        console.error('Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const isOrderPaid = (order) => {
    return order.paymentStatus === 'paid';
  };

  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (orderToDelete) {
      await removeOrderFromHistory(orderToDelete._id);
    }
    setDeleteDialog(false);
  };

  const handleDeleteCancel = () => {
    setDeleteDialog(false);
  };

  // Calculate total amount for an order, ensuring it's never zero
  const getOrderTotal = (order) => {
    if (order.total && order.total > 0) {
      return order.total;
    }
    
    // If total is 0 or undefined, try preserved data first
    if (preservedOrderData && preservedOrderData.total > 0) {
      return preservedOrderData.total;
    }
    
    // If still no data, recalculate from components
    const subtotal = order.subtotal || 0;
    const deliveryFee = order.deliveryFee || 0;
    const tip = order.tip || 0;
    const calculatedTotal = subtotal + deliveryFee + tip;
    
    // Final fallback - use cart data
    if (calculatedTotal === 0 && cart?.total) {
      return cart.total + (cart.delivery?.fee || 0) + (cart.tip?.amount || 0);
    }
    
    return calculatedTotal > 0 ? calculatedTotal : 0;
  };

  // Calculate subtotal for an order with fallbacks
  const getOrderSubtotal = (order) => {
    if (order.subtotal && order.subtotal > 0) {
      return order.subtotal;
    }
    
    if (preservedOrderData && preservedOrderData.subtotal > 0) {
      return preservedOrderData.subtotal;
    }
    
    return cart?.total || 0;
  };

  // Calculate delivery fee with fallbacks
  const getOrderDeliveryFee = (order) => {
    if (order.deliveryFee && order.deliveryFee > 0) {
      return order.deliveryFee;
    }
    
    if (preservedOrderData && preservedOrderData.deliveryFee > 0) {
      return preservedOrderData.deliveryFee;
    }
    
    return cart?.delivery?.fee || 0;
  };

  // Calculate tip with fallbacks
  const getOrderTip = (order) => {
    if (order.tip && order.tip > 0) {
      return order.tip;
    }
    
    if (preservedOrderData && preservedOrderData.tip > 0) {
      return preservedOrderData.tip;
    }
    
    return cart?.tip?.amount || 0;
  };

  // Filter for displaying the current order or recent orders
  let displayedOrders = [];
  
  // Prioritize showing the current order if it exists
  if (currentOrderId && currentOrder) {
    // Ensure the current order has all required fields properly set
    displayedOrders = [{
      ...currentOrder,
      // Make sure payment status is correct for cash orders
      paymentStatus: currentOrder.paymentMethod === 'cash' 
        ? 'pending' 
        : (currentOrder.paymentStatus || 'unpaid'),
      // Ensure financial fields are never zero
      subtotal: getOrderSubtotal(currentOrder),
      deliveryFee: getOrderDeliveryFee(currentOrder),
      tip: getOrderTip(currentOrder),
      total: getOrderTotal(currentOrder)
    }];
  }
  // If we have currentOrderId but no currentOrder, create a fallback order
  else if (currentOrderId && orderComplete) {
    // Get the data either from preservedOrderData or calculate it
    const subtotalAmount = preservedOrderData?.subtotal || cart?.total || 0;
    const deliveryFeeAmount = preservedOrderData?.deliveryFee || cart?.delivery?.fee || 0;
    const tipAmount = preservedOrderData?.tip || cart?.tip?.amount || 0;
    const totalAmount = preservedOrderData?.total || 
                        (subtotalAmount + deliveryFeeAmount + tipAmount);
    
    // Create a temporary placeholder order while waiting for the real one
    console.log('Creating fallback order with ID:', currentOrderId);
    const fallbackOrder = {
      _id: currentOrderId,
      status: 'Placed',
      paymentMethod: paymentMethod || 'card', // Fallback to card if not available
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'unpaid',
      items: preservedOrderData?.items || cart?.items || [],
      subtotal: subtotalAmount,
      deliveryFee: deliveryFeeAmount,
      tip: tipAmount,
      total: totalAmount,
      createdAt: new Date().toISOString(),
      deliveryAddress: deliveryAddress || 'Delivery address'
    };
    displayedOrders = [fallbackOrder];
  }
  // If we just completed an order but don't have the ID, show the most recent
  else if (orderComplete && orderHistory && orderHistory.length > 0) {
    displayedOrders = [orderHistory[0]];
  }
  // Otherwise show up to 3 recent orders
  else if (orderHistory && orderHistory.length > 0) {
    displayedOrders = orderHistory.slice(0, 3);
  }

  // Show loading while waiting for orders
  if (isLoading) {
    return (
      <Paper sx={{ p: 3, mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Typography variant="body1" color="text.secondary">
          Loading your order information...
        </Typography>
      </Paper>
    );
  }

  // No orders case - still provide a confirmation message
  if (displayedOrders.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {orderComplete ? 'Order Placed Successfully' : 'No Recent Orders'}
        </Typography>
        
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" paragraph>
            {orderComplete 
              ? 'Your order has been placed successfully! The order details will appear here shortly.'
              : 'You have no recent orders.'}
          </Typography>
          
          {orderComplete && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={safelyFetchOrders}
              sx={{ mt: 2 }}
            >
              Refresh Order Details
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {orderComplete ? 'Order Placed Successfully' : 'Recent Orders'}
      </Typography>
      
      {displayedOrders.map((order) => (
        <OrderHistoryItem key={order._id}>
          <OrderHistoryItemContainer>
            <OrderHistoryContent>
              <Typography variant="subtitle1" gutterBottom>
                Order #{order._id?.substring(0, 8) || 'New'}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(new Date(order.createdAt || new Date()), 'PPP p')}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <OrderStatusChip 
                  size="small" 
                  label={order.status || 'Placed'} 
                  status={order.status || 'Placed'} 
                  icon={<CheckCircleIcon />} 
                />
                <Box sx={{ ml: 1 }}>
                  {(order.paymentMethod === 'card') ? (
                    <Typography 
                      variant="caption" 
                      color={(order.paymentStatus === 'paid' || paidOrders.has(order._id)) ? 'success.main' : 'warning.main'}
                      sx={{ ml: 1, fontWeight: 'bold' }}
                    >
                      Payment: {(order.paymentStatus === 'paid' || paidOrders.has(order._id)) ? 'Paid' : 'Pending'}
                    </Typography>
                  ) : (
                    <Typography 
                      variant="caption" 
                      color="info.main"
                      sx={{ ml: 1, fontWeight: 'bold' }}
                    >
                      Cash on Delivery
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {/* Show paid info if already paid or just paid */}
              {(order.paymentStatus === 'paid' || paidOrders.has(order._id)) && (
                <Box sx={{ mb: 2, p: 1, bgcolor: 'success.light', borderRadius: 1, display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon fontSize="small" sx={{ color: 'success.dark', mr: 1 }} />
                  <Typography variant="body2" color="success.dark">
                    Payment of ${getOrderTotal(order).toFixed(2)} completed successfully
                  </Typography>
                </Box>
              )}
              
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    {(order.items?.length || 0)} item{(order.items?.length || 0) !== 1 ? 's' : ''} - ${getOrderTotal(order).toFixed(2)}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {(order.items || []).map((item, index) => (
                      <ListItem key={index}>
                        {item.image && (
                          <Box
                            component="img"
                            src={item.image}
                            alt={item.title}
                            sx={{
                              width: 40,
                              height: 40,
                              objectFit: 'cover',
                              borderRadius: 1,
                              mr: 2
                            }}
                          />
                        )}
                        <ListItemText 
                          primary={item.title} 
                          secondary={`${item.quantity} x $${item.price?.toFixed(2) || '0.00'}`} 
                        />
                        <Typography>
                          ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Subtotal</Typography>
                    <Typography variant="body2">${getOrderSubtotal(order).toFixed(2)}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Delivery Fee</Typography>
                    <Typography variant="body2">${getOrderDeliveryFee(order).toFixed(2)}</Typography>
                  </Box>
                  
                  {getOrderTip(order) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Tip</Typography>
                      <Typography variant="body2">${getOrderTip(order).toFixed(2)}</Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="subtitle2">Total</Typography>
                    <Typography variant="subtitle2">${getOrderTotal(order).toFixed(2)}</Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </OrderHistoryContent>
            
            <OrderActionsContainer>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                {/* Only show Pay button for card payments that are not yet paid */}
                {order.paymentMethod === 'card' && order.paymentStatus !== 'paid' && !paidOrders.has(order._id) && (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small"
                    onClick={() => handleOpenPaymentPortal(order)}
                  >
                    Pay Now
                  </Button>
                )}
              </Box>
            </OrderActionsContainer>
          </OrderHistoryItemContainer>
        </OrderHistoryItem>
      ))}
      
      {/* Payment Portal Dialog */}
      <PaymentPortal
        open={openPaymentPortal}
        onClose={handleClosePaymentPortal}
        order={{
          ...selectedOrder,
          // Ensure total is never zero by using the getOrderTotal function
          total: selectedOrder ? getOrderTotal(selectedOrder) : getOrderTotal(displayedOrders[0])
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </Paper>
  );
};

export default Checkout; 