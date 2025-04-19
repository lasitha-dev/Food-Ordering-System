import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper,
  Avatar,
  Alert,
  CircularProgress
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import * as authApi from '../services/auth-service/api';

// Validation schema
const validationSchema = Yup.object({
  newPassword: Yup
    .string()
    .min(8, 'Password should be at least 8 characters')
    .required('New password is required'),
  confirmPassword: Yup
    .string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Please confirm your password')
});

const ChangePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Get user details from location state
  const email = location.state?.email;
  const userId = location.state?.userId;
  const userName = location.state?.userName;
  
  // Redirect to login if no email or userId provided
  useEffect(() => {
    if (!email || !userId) {
      navigate('/login', { replace: true });
    }
  }, [email, userId, navigate]);
  
  const formik = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setError('');
      setSuccess('');
      
      try {
        console.log('Submitting password change:', { userId, newPassword: values.newPassword });
        
        // Call the API to change password
        const response = await authApi.changePassword({
          userId,
          email,
          newPassword: values.newPassword
        });
        
        if (response.success) {
          setSuccess('Password changed successfully! You will be redirected to login page.');
          
          // Clear any stored session data
          sessionStorage.removeItem('passwordChangeUser');
          
          // Redirect to login page after a delay
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
        } else {
          setError(response.message || 'Failed to change password');
        }
      } catch (err) {
        console.error('Password change error:', err);
        setError(err.message || 'An unexpected error occurred. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  });
  
  if (!email || !userId) {
    return null; // Will redirect via useEffect
  }
  
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockResetIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Change Password
        </Typography>
        
        <Typography variant="subtitle1" sx={{ mt: 1 }}>
          Hi {userName || email}! You need to set a new password to continue.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
            {success}
          </Alert>
        )}
        
        <Box 
          component="form" 
          onSubmit={formik.handleSubmit} 
          sx={{ mt: 3, width: '100%' }}
        >
          <TextField
            margin="normal"
            fullWidth
            name="newPassword"
            label="New Password"
            type="password"
            id="newPassword"
            value={formik.values.newPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
            helperText={formik.touched.newPassword && formik.errors.newPassword}
            disabled={isSubmitting || !!success}
          />
          <TextField
            margin="normal"
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            disabled={isSubmitting || !!success}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting || !!success}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Change Password'}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/login')}
            disabled={isSubmitting || !!success}
            sx={{ mb: 2 }}
          >
            Back to Login
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ChangePassword; 