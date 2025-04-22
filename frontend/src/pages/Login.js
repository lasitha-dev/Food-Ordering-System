import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper,
  Avatar,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  useTheme,
  useMediaQuery
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailIcon from '@mui/icons-material/Email';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import useAuth from '../hooks/useAuth';

// Validation schema
const validationSchema = Yup.object({
  email: Yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: Yup
    .string()
    .required('Password is required')
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Get redirect URL from location state or default to dashboard
  const from = location.state?.from?.pathname || '/';
  
  // Check for registration success message
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clean up the state to prevent the message from persisting on page reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setIsSubmitting(true);
      setError('');
      
      try {
        console.log('Submitting login form with values:', values);
        const result = await login(values.email, values.password);
        console.log('Login result:', result);
        
        if (result.success) {
          // Handle password change required case
          if (result.passwordChangeRequired) {
            console.log('Password change required, redirecting to change password page');
            navigate('/change-password', { 
              state: { 
                email: values.email,
                userId: result.user?._id || result.user?.id,
                userName: result.user?.name || `${result.user?.firstName || ''} ${result.user?.lastName || ''}`
              } 
            });
            return;
          }
          
          console.log('Login successful, navigating to:', from);
          
          // Use direct browser navigation as a fallback mechanism
          let dashboardPath = '/';
          
          // Determine the correct dashboard based on user role from AuthContext
          if (result.user && result.user.userType) {
            const userType = result.user.userType;
            console.log('User type from login result:', userType);
            
            switch(userType) {
              case 'admin':
                dashboardPath = '/admin';
                console.log('Admin user detected, redirecting to /admin');
                break;
              case 'restaurant-admin':
                dashboardPath = '/restaurant';
                console.log('Restaurant admin detected, redirecting to /restaurant');
                break;
              case 'delivery-personnel':
                dashboardPath = '/delivery';
                console.log('Delivery personnel detected, redirecting to /delivery');
                break;
              case 'customer':
                dashboardPath = '/customer';
                console.log('Customer detected, redirecting to /customer');
                break;
              default:
                dashboardPath = '/';
                console.log('Unknown user type, redirecting to home page');
            }
          } else {
            console.warn('No user type found in login result, using default path');
          }
          
          console.log('Redirecting to dashboard:', dashboardPath);
          
          // Try React Router navigation first
          navigate(dashboardPath, { replace: true });
          
          // As a fallback, use direct browser navigation after a short delay
          setTimeout(() => {
            if (window.location.pathname === '/login') {
              console.log('React Router navigation failed, using direct navigation');
              window.location.href = dashboardPath;
            }
          }, 500);
        } else {
          setError(result.message || 'Login failed');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        console.error('Login error:', err);
      } finally {
        setIsSubmitting(false);
        setSubmitting(false);
      }
    }
  });

  // Example login credentials helper
  const setExampleCredentials = (type) => {
    let email, password;
    
    switch(type) {
      case 'admin':
        email = 'admin@fooddelivery.com';
        password = 'Admin@123456';
        break;
      case 'restaurant':
        email = 'sunil@gmail.com';
        password = 'Sunil1998!';
        break;
      case 'delivery':
        email = 'delivery@example.com';
        password = 'password';
        break;
      case 'customer':
        email = 'customer@example.com';
        password = 'password';
        break;
      default:
        return;
    }
    
    formik.setFieldValue('email', email);
    formik.setFieldValue('password', password);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(45deg, rgba(253,187,45,0.15) 0%, rgba(229,57,53,0.15) 100%)',
        backgroundSize: 'cover',
      }}
    >
      <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', py: 4 }}>
        <Card sx={{ 
          width: '100%', 
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)'
        }}>
          <Grid container>
            {!isMobile && (
              <Grid item xs={12} md={5} 
                sx={{ 
                  background: 'linear-gradient(45deg, #e53935 30%, #ff9800 90%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                  color: 'white'
                }}
              >
                <RestaurantIcon sx={{ fontSize: 56, mb: 2 }} />
                <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                  Food Ordering
                </Typography>
                <Typography variant="body1" align="center">
                  Your favorite food, delivered fast and fresh.
                </Typography>
                <Box sx={{ mt: 4 }}>
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/4039/4039232.png" 
                    alt="Food Delivery" 
                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '200px', opacity: 0.9 }}
                  />
                </Box>
              </Grid>
            )}
            
            <Grid item xs={12} md={7}>
              <CardContent sx={{ p: 4, height: '100%' }}>
                <Box 
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5" fontWeight={600}>
                      Sign in to your account
                    </Typography>
                  </Box>
                  
                  {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error}
                    </Alert>
                  )}
                  
                  {successMessage && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                      {successMessage}
                    </Alert>
                  )}
                  
                  <Box 
                    component="form" 
                    onSubmit={(e) => {
                      e.preventDefault();
                      formik.handleSubmit(e);
                    }}
                  >
                    <TextField
                      margin="normal"
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      autoFocus
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.email && Boolean(formik.errors.email)}
                      helperText={formik.touched.email && formik.errors.email}
                      disabled={isSubmitting}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      margin="normal"
                      fullWidth
                      name="password"
                      label="Password"
                      type="password"
                      id="password"
                      autoComplete="current-password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.password && Boolean(formik.errors.password)}
                      helperText={formik.touched.password && formik.errors.password}
                      disabled={isSubmitting}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <VpnKeyIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      sx={{ mt: 3, mb: 2, py: 1.5 }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                    </Button>
                    <Grid container>
                      <Grid item xs>
                        <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                          <Typography variant="body2" color="primary" fontWeight={500}>
                            Forgot password?
                          </Typography>
                        </Link>
                      </Grid>
                      <Grid item>
                        <Link to="/register" style={{ textDecoration: 'none' }}>
                          <Typography variant="body2" color="primary" fontWeight={500}>
                            {"Don't have an account? Sign Up"}
                          </Typography>
                        </Link>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 4 }}>
                      <Typography color="textSecondary" variant="body2">
                        Demo Accounts
                      </Typography>
                    </Divider>

                    {/* For testing purposes */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          fullWidth
                          onClick={() => setExampleCredentials('admin')}
                        >
                          Admin
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          fullWidth
                          onClick={() => setExampleCredentials('restaurant')}
                        >
                          Restaurant
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          fullWidth
                          onClick={() => setExampleCredentials('delivery')}
                        >
                          Delivery
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          fullWidth
                          onClick={() => setExampleCredentials('customer')}
                        >
                          Customer
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </CardContent>
            </Grid>
          </Grid>
        </Card>
      </Container>
    </Box>
  );
};

export default Login; 