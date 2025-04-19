import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  Grid,
  Divider
} from '@mui/material';
import {
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { styled } from '@mui/material/styles';

const CardElementContainer = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.palette.background.paper
}));

const StyledCardElement = styled(CardElement)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(1.5),
  fontSize: '16px',
  '& .StripeElement': {
    width: '100%'
  }
}));

const PaymentButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1.5),
}));

const StripePaymentForm = ({ amount, orderId, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
  });

  const handleChange = (e) => {
    setBillingDetails({
      ...billingDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    if (!billingDetails.name || !billingDetails.email) {
      setError("Please fill in all required fields");
      return;
    }

    setProcessing(true);
    setError(null);
    
    try {
      // In a real implementation, you would call your backend to create a payment intent
      // For demo purposes, we're simulating a successful payment
      
      // This would be replaced with a proper Stripe payment intent creation
      // const { data: clientSecret } = await api.createPaymentIntent({
      //   amount: amount * 100, // Stripe expects amount in cents
      //   orderId
      // });
      
      // Simulate a delay to mimic API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would confirm the payment with Stripe
      // const payload = await stripe.confirmCardPayment(clientSecret, {
      //   payment_method: {
      //     card: elements.getElement(CardElement),
      //     billing_details: billingDetails
      //   }
      // });
      
      // if (payload.error) {
      //   setError(payload.error.message);
      //   setProcessing(false);
      //   return;
      // }
      
      setSucceeded(true);
      setProcessing(false);
      onSuccess && onSuccess({
        orderId,
        paymentId: `pi_${Math.random().toString(36).substr(2, 9)}`, // Simulated payment ID
        amount
      });
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true
  };

  return (
    <Paper elevation={2} sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom align="center">
        Card Payment
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom align="center">
        Order #{orderId?.substring(orderId.length - 6)}
      </Typography>
      
      <Box sx={{ my: 3 }}>
        <Typography variant="h4" align="center" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          ${parseFloat(amount).toFixed(2)}
        </Typography>
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      {succeeded ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Payment successful! Your order is now being processed.
          </Alert>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // Store payment result to persist it even when clicking this button
              const paymentResult = {
                orderId,
                paymentId: `pi_${Math.random().toString(36).substr(2, 9)}`,
                amount
              };
              onSuccess && onSuccess(paymentResult);
            }}
          >
            Return to Orders
          </Button>
        </Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Name on Card"
                name="name"
                value={billingDetails.name}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                name="email"
                type="email"
                value={billingDetails.email}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Card Information
              </Typography>
              <CardElementContainer>
                <StyledCardElement 
                  options={cardElementOptions}
                  onChange={e => {
                    if (e.error) {
                      setError(e.error.message);
                    } else {
                      setError(null);
                    }
                  }}
                />
              </CardElementContainer>
              <Typography variant="caption" color="text.secondary">
                Test card: 4242 4242 4242 4242 | Exp: Any future date | CVC: Any 3 digits | ZIP: Any 5 digits
              </Typography>
            </Grid>
          </Grid>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button 
              variant="outlined"
              onClick={onCancel}
              disabled={processing}
            >
              Cancel
            </Button>
            
            <PaymentButton
              type="submit"
              variant="contained"
              color="primary"
              disabled={!stripe || processing}
            >
              {processing ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                  Processing...
                </>
              ) : (
                `Pay $${parseFloat(amount).toFixed(2)}`
              )}
            </PaymentButton>
          </Box>
        </form>
      )}
    </Paper>
  );
};

export default StripePaymentForm; 