import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Button,
  TextField,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Slide,
  Alert
} from '@mui/material';
import { Delete as DeleteIcon, Add, Remove } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useCart } from '../../context/CartContext';

// Styled components
const CartPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
  marginBottom: theme.spacing(3),
  width: '100%'
}));

const CartHeader = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
}));

const CartItemImage = styled('img')(({ theme }) => ({
  width: 80,
  height: 60,
  objectFit: 'cover',
  borderRadius: theme.shape.borderRadius,
  marginRight: theme.spacing(2),
}));

const PriceText = styled('span')(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.primary.main,
  display: 'block',
  marginBottom: theme.spacing(1),
}));

const TotalRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 0),
  borderTop: `1px solid ${theme.palette.divider}`,
  marginTop: theme.spacing(2),
}));

const QuantityControl = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: theme.spacing(1),
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ItemInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
}));

const ShoppingCart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, setTip, setDeliveryFee } = useCart();
  
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [tipPercentage, setTipPercentage] = useState(10);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  
  // Calculate totals
  const subtotal = cart.total || 0;
  const deliveryFee = 4.99;
  const tipPercentageValue = tipPercentage || 0;
  const tipAmount = ((subtotal * tipPercentageValue) / 100).toFixed(2);
  const totalAmount = (parseFloat(subtotal || 0) + parseFloat(deliveryFee || 0) + parseFloat(tipAmount || 0)).toFixed(2);
  
  // Handle quantity changes
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };
  
  // Handle changing tip percentage
  const handleTipChange = (event, newTipPercentage) => {
    if (newTipPercentage !== null) {
      setTipPercentage(newTipPercentage);
      setTip({
        percentage: newTipPercentage,
        amount: (subtotal * (newTipPercentage / 100)).toFixed(2)
      });
    }
  };
  
  // Handle checkout process
  const handleCheckout = () => {
    if (!deliveryAddress.trim()) {
      alert('Please enter your delivery address');
      return;
    }
    
    setCheckoutDialogOpen(true);
  };
  
  const confirmCheckout = () => {
    // Here you would normally integrate with your order service
    // For now, we'll just simulate a successful checkout
    
    // Close dialog and show confirmation
    setCheckoutDialogOpen(false);
    setCheckoutComplete(true);
    
    // Clear cart after successful checkout
    setTimeout(() => {
      clearCart();
      setCheckoutComplete(false);
    }, 3000);
  };
  
  // If cart is not available or cart items is not available
  if (!cart || !cart.items || !Array.isArray(cart.items) || cart.items.length === 0) {
    return (
      <CartPaper>
        <CartHeader variant="h5">Your Order</CartHeader>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Add some delicious items to your cart to place an order
          </Typography>
        </Box>
      </CartPaper>
    );
  }
  
  return (
    <>
      {checkoutComplete && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          onClose={() => setCheckoutComplete(false)}
        >
          Your order has been placed successfully!
        </Alert>
      )}
      
      <CartPaper>
        <CartHeader variant="h5">Your Order</CartHeader>
        
        <List sx={{ width: '100%', p: 0 }}>
          {cart.items.map((item) => (
            <React.Fragment key={item._id}>
              <ListItem alignItems="flex-start" sx={{ px: 0, py: 2 }}>
                <CartItemImage 
                  src={item.imageUrl || 'https://via.placeholder.com/80x60?text=Food'} 
                  alt={item.title} 
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, mr: 7 }}>
                  <Typography variant="subtitle1">{item.title}</Typography>
                  <PriceText>${(item.price || 21.00).toFixed(2)}</PriceText>
                  
                  <QuantityControl>
                    <IconButton 
                      size="small" 
                      onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    
                    <Typography variant="body2" sx={{ mx: 1 }}>
                      {item.quantity}
                    </Typography>
                    
                    <IconButton 
                      size="small" 
                      onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </QuantityControl>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'absolute', right: 16 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    ${((item.price || 21.00) * item.quantity).toFixed(2)}
                  </Typography>
                  <IconButton 
                    edge="end" 
                    onClick={() => removeFromCart(item._id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
        
        <Box sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Enter delivery address"
            variant="outlined"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="123 Main St, City, State"
            margin="normal"
            required
          />
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tip amount
            </Typography>
            <ToggleButtonGroup
              value={tipPercentage}
              exclusive
              onChange={handleTipChange}
              aria-label="tip percentage"
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton value={0}>
                No Tip
              </ToggleButton>
              <ToggleButton value={10}>
                10%
              </ToggleButton>
              <ToggleButton value={15}>
                15%
              </ToggleButton>
              <ToggleButton value={20}>
                20%
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Order Summary
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">${subtotal.toFixed(2)}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
              <Typography variant="body2">Delivery Fee:</Typography>
              <Typography variant="body2">${deliveryFee.toFixed(2)}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
              <Typography variant="body2">Tip ({tipPercentage}%):</Typography>
              <Typography variant="body2">${tipAmount}</Typography>
            </Box>
            
            <TotalRow>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Total:
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                ${totalAmount}
              </Typography>
            </TotalRow>
          </Box>
          
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            onClick={handleCheckout}
            sx={{ mt: 3 }}
          >
            Go to checkout
          </Button>
        </Box>
      </CartPaper>
      
      {/* Checkout Confirmation Dialog */}
      <Dialog
        open={checkoutDialogOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setCheckoutDialogOpen(false)}
      >
        <DialogTitle>Confirm your order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You're about to place an order for ${totalAmount}. Please confirm to proceed with payment.
          </DialogContentText>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Delivery Address:
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {deliveryAddress}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={confirmCheckout} variant="contained" color="primary">
            Confirm Order
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ShoppingCart; 