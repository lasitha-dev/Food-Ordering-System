import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Dialog, 
  DialogContent, 
  IconButton,
  Paper,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePaymentForm';
import { useNavigate } from 'react-router-dom';

// Replace with your own Stripe publishable key
// For testing, you can use the Stripe test publishable key
const stripePromise = loadStripe('pk_test_51H8jySLbgQdmHy6HcVEYkrpyHQdIjlb7a2QQ6Q2YMbEXPTUB1wOeD9PtwXXWjWgHcmAjfWTxOPAWE8PQT65mM34j00VmJsQF5P');

const steps = ['Billing Information', 'Card Details', 'Confirmation'];

const PaymentPortal = ({ open, onClose, order, onPaymentSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  
  const handlePaymentSuccess = (paymentResult) => {
    setActiveStep(2); // Move to confirmation step
    
    // Ensure we always have a valid payment result to pass
    const validPaymentResult = paymentResult || {
      orderId: order?.id,
      paymentId: `fallback_${Date.now()}`,
      amount: order?.total || 0
    };
    
    // Update order status or perform other actions
    if (onPaymentSuccess) {
      onPaymentSuccess(validPaymentResult);
    }
    
    // Close the dialog after a delay without navigating
    setTimeout(() => {
      onClose();
    }, 3000);
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6">
          Secure Payment
        </Typography>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <DialogContent sx={{ p: 3 }}>
        <Container maxWidth="md">
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Box sx={{ py: 2 }}>
            <Elements stripe={stripePromise}>
              <StripePaymentForm
                amount={order?.total}
                orderId={order?.id}
                onSuccess={handlePaymentSuccess}
                onCancel={onClose}
              />
            </Elements>
          </Box>
          
          <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              This is a secure payment processed by Stripe. Your card information is encrypted and never stored on our servers.
            </Typography>
          </Box>
        </Container>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentPortal; 