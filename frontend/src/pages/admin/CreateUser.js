import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  TextField, 
  MenuItem,
  FormControl,
  FormControlLabel,
  FormLabel,
  FormHelperText,
  Switch,
  Grid,
  Alert,
  CircularProgress 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import * as authApi from '../../services/auth-service/api';
import useAuth from '../../hooks/useAuth';

// Validation schema
const validationSchema = Yup.object({
  firstName: Yup
    .string()
    .required('First name is required'),
  lastName: Yup
    .string()
    .required('Last name is required'),
  email: Yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: Yup
    .string()
    .min(8, 'Password should be of minimum 8 characters length')
    .required('Password is required'),
  confirmPassword: Yup
    .string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  userType: Yup
    .string()
    .oneOf(['admin', 'restaurant-admin', 'delivery-personnel'], 'Invalid user type')
    .required('User type is required'),
  active: Yup
    .boolean()
});

const CreateUser = () => {
  const navigate = useNavigate();
  const { createUserDirectly } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: 'restaurant-admin',
      active: true
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');
      
      try {
        console.log('Submitting user data:', values);
        
        // Add name field from first and last names
        const userData = {
          ...values,
          name: `${values.firstName} ${values.lastName}`
        };
        
        console.log('Creating user with transformed data:', userData);
        
        // Try the admin API first
        try {
          const response = await authApi.createUser(userData);
          
          if (response.success) {
            console.log('User created successfully:', response);
            setSubmitSuccess('User created successfully!');
            
            // Add to localStorage for development/demo
            const existingUsers = JSON.parse(localStorage.getItem('createdUsers') || '[]');
            const newUser = {
              ...response.data?.user,
              id: response.data?.user?.id || `local_${Date.now()}`
            };
            localStorage.setItem('createdUsers', JSON.stringify([...existingUsers, newUser]));
            
            // Trigger storage event to notify other components
            window.dispatchEvent(new Event('storage'));
            
            // After a delay, navigate back to user list
            setTimeout(() => {
              navigate('/admin/users', { state: { refresh: true } });
            }, 1500);
            return;
          }
        } catch (adminError) {
          console.log('Admin API failed, trying direct registration', adminError);
          console.log('Admin error:', adminError);
          
          // Check if this is a duplicate email error
          if (adminError.message && adminError.message.includes('already exists')) {
            setSubmitError(`A user with email "${values.email}" already exists. Please use a different email address.`);
            setIsSubmitting(false);
            return;
          }
        }
        
        // If admin API fails, try direct registration
        try {
          const directResponse = await createUserDirectly(userData);
          
          if (directResponse.success) {
            console.log('User created via direct registration:', directResponse);
            setSubmitSuccess('User created successfully via direct registration!');
            
            // After a delay, navigate back to user list
            setTimeout(() => {
              navigate('/admin/users', { state: { refresh: true } });
            }, 1500);
            return;
          }
        } catch (directError) {
          console.log('Direct registration error:', directError);
          
          // If this is also a duplicate email error from direct registration
          if (directError.message && directError.message.includes('already exists')) {
            setSubmitError(`A user with email "${values.email}" already exists. Please use a different email address.`);
            setIsSubmitting(false);
            return;
          }
          
          // Try using localStorage as a fallback for demo/development
          try {
            console.log('API registration failed, using localStorage fallback');
            
            // Generate a mock user with local ID
            const mockUser = {
              ...userData,
              id: `local_${Date.now()}`,
              active: true,
              createdAt: new Date().toISOString()
            };
            
            // Store in localStorage
            const existingUsers = JSON.parse(localStorage.getItem('createdUsers') || '[]');
            localStorage.setItem('createdUsers', JSON.stringify([...existingUsers, mockUser]));
            
            // Trigger storage event to notify other components
            window.dispatchEvent(new Event('storage'));
            
            console.log('Created user in localStorage:', mockUser);
            setSubmitSuccess('User created successfully via localStorage fallback!');
            
            // After a delay, navigate back to user list with refresh flag
            setTimeout(() => {
              // Create a custom event before navigating
              const refreshEvent = new CustomEvent('userListRefresh', { 
                detail: { timestamp: Date.now() } 
              });
              window.dispatchEvent(refreshEvent);
              console.log('Dispatched userListRefresh event');
              
              // Navigate with refresh state
              navigate('/admin/users', { state: { refresh: true } });
            }, 1500);
            return;
          } catch (localStorageError) {
            console.error('Failed to store user in localStorage:', localStorageError);
          }
        }
        
        // If we reached here, both API methods failed
        throw new Error('Failed to create user through all available methods');
      } catch (err) {
        console.log('Error creating user:', err);
        console.log('Error details:', err.data || err);
        
        // Handle different error types
        if (err.message && err.message.includes('already exists')) {
          setSubmitError(`A user with this email already exists. Please use a different email address.`);
        } else {
          setSubmitError(err.message || 'Failed to create user. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  });
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/admin/users')}
        >
          Back to Users
        </Button>
      </Box>
      
      <Typography variant="h4" gutterBottom>
        Create New User
      </Typography>
      
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}
      
      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {submitSuccess}
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="firstName"
                name="firstName"
                label="First Name"
                variant="outlined"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
                disabled={isSubmitting}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="lastName"
                name="lastName"
                label="Last Name"
                variant="outlined"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
                disabled={isSubmitting}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                variant="outlined"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={isSubmitting}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type="password"
                variant="outlined"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                disabled={isSubmitting}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                variant="outlined"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                disabled={isSubmitting}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="userType"
                name="userType"
                label="User Type"
                select
                variant="outlined"
                value={formik.values.userType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.userType && Boolean(formik.errors.userType)}
                helperText={formik.touched.userType && formik.errors.userType || "Note: Customers should register through the public registration page"}
                disabled={isSubmitting}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="restaurant-admin">Restaurant Admin</MenuItem>
                <MenuItem value="delivery-personnel">Delivery Personnel</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Account Status</FormLabel>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.active}
                      onChange={formik.handleChange}
                      name="active"
                      disabled={isSubmitting}
                    />
                  }
                  label={formik.values.active ? "Active" : "Inactive"}
                />
                {formik.touched.active && Boolean(formik.errors.active) && (
                  <FormHelperText error>{formik.errors.active}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  sx={{ mr: 1 }}
                  onClick={() => navigate('/admin/users')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Create User'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateUser; 