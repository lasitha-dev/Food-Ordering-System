import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Grid, TextField, MenuItem, FormControl, FormControlLabel, FormLabel, FormHelperText, Switch, Alert, CircularProgress } from '@mui/material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import * as authApi from '../../services/auth-service/api';

// Define protected demo user emails that shouldn't be edited/deleted
const PROTECTED_DEMO_USERS = [
  'admin@fooddelivery.com',
  'restaurant@example.com',
  'delivery@example.com'
];

// Validation schema - similar to CreateUser but without password requirements
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
  userType: Yup
    .string()
    .oneOf(['admin', 'restaurant-admin', 'delivery-personnel', 'customer'], 'Invalid user type')
    .required('User type is required'),
  active: Yup
    .boolean()
});

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState(null);
  const [isProtectedUser, setIsProtectedUser] = useState(false);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await authApi.getUser(id);
        
        if (response.success) {
          const user = response.data;
          
          // Check if this is a protected demo user
          if (PROTECTED_DEMO_USERS.includes(user.email)) {
            setIsProtectedUser(true);
            setError('This is a demo account and cannot be edited.');
          }
          
          // Prepare data for form
          setUserData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            userType: user.userType || 'customer',
            active: user.active !== undefined ? user.active : true,
            phone: user.phone || ''
          });
        } else {
          setError('Failed to load user data');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user data: ' + (err.message || 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  // Initialize formik after user data is loaded
  const formik = useFormik({
    enableReinitialize: true, // Important: allows form to update when initialValues change
    initialValues: userData || {
      firstName: '',
      lastName: '',
      email: '',
      userType: 'customer',
      active: true,
      phone: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      // Don't submit if this is a protected user
      if (isProtectedUser) {
        setError('This is a demo account and cannot be edited.');
        return;
      }
      
      setIsSubmitting(true);
      setError('');
      setSuccess('');
      
      try {
        // Format the data to match backend expectations
        const updateData = {
          ...values,
          name: `${values.firstName} ${values.lastName}` // Add name for backward compatibility
        };
        
        console.log('Submitting updated user data:', updateData);
        
        // Call the update API
        const response = await authApi.updateUser(id, updateData);
        
        if (response.success) {
          setSuccess('User updated successfully!');
          
          // After a delay, navigate back to user list
          setTimeout(() => {
            navigate('/admin/users', { state: { refresh: true } });
          }, 1500);
        } else {
          setError(response.message || 'Failed to update user');
        }
      } catch (err) {
        console.error('Error updating user:', err);
        setError(err.message || 'Failed to update user');
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          component={Link}
          to="/admin/users"
        >
          Back to Users
        </Button>
      </Box>
      
      <Typography variant="h4" gutterBottom>
        Edit User
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {isProtectedUser && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This is a demo account and cannot be modified. Demo accounts are protected to maintain application functionality.
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
                disabled={isSubmitting || isProtectedUser}
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
                disabled={isSubmitting || isProtectedUser}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
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
                disabled={isSubmitting || isProtectedUser}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="phone"
                name="phone"
                label="Phone Number"
                variant="outlined"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
                disabled={isSubmitting || isProtectedUser}
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
                helperText={formik.touched.userType && formik.errors.userType}
                disabled={isSubmitting || isProtectedUser}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="restaurant-admin">Restaurant Admin</MenuItem>
                <MenuItem value="delivery-personnel">Delivery Personnel</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
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
                      disabled={isSubmitting || isProtectedUser}
                    />
                  }
                  label={formik.values.active ? 'Active' : 'Inactive'}
                />
                <FormHelperText>
                  {formik.values.active 
                    ? 'User can log in and access the system' 
                    : 'User cannot log in or access the system'}
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              component={Link}
              to="/admin/users"
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting || isProtectedUser}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default EditUser; 