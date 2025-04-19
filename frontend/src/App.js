import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';

// Import our custom ThemeProvider
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Import the CartProvider
import { CartProvider } from './context/CartContext';

// Layout components
import MainLayout from './components/layouts/MainLayout';
import AdminLayout from './components/layouts/AdminLayout';
import RestaurantLayout from './components/layouts/RestaurantLayout';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import CreateUser from './pages/admin/CreateUser';
import EditUser from './pages/admin/EditUser';
import Settings from './pages/admin/Settings';

// Protected route component
import ProtectedRoute from './components/ProtectedRoute';

// Customer pages
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerCheckout from './pages/customer/Checkout';
import CustomerSettings from './pages/customer/Settings';
import OrderHistory from './pages/customer/OrderHistory';

// Restaurant admin pages
import RestaurantDashboard from './pages/restaurant/Dashboard';
import FoodItems from './pages/restaurant/FoodItems';
import CreateFoodItem from './pages/restaurant/CreateFoodItem';
import EditFoodItem from './pages/restaurant/EditFoodItem';
import RestaurantSettings from './pages/restaurant/Settings';

// Delivery personnel pages
import DeliveryDashboard from './pages/delivery/Dashboard';

// Custom theme builder function that accepts mode (light/dark)
const createAppTheme = (mode) => createTheme({
  palette: {
    mode, // This sets the theme mode to 'light' or 'dark'
    primary: {
      light: '#f44336',
      main: '#e53935',
      dark: '#d32f2f',
      contrastText: '#fff',
    },
    secondary: {
      light: '#4caf50',
      main: '#43a047',
      dark: '#388e3c',
      contrastText: '#fff',
    },
    success: {
      main: '#66bb6a',
    },
    warning: {
      main: '#ffa000',
    },
    error: {
      main: '#d32f2f',
    },
    background: {
      default: mode === 'light' ? '#f9f9f9' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#d32f2f',
          },
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: '#388e3c',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

// Theme-aware App component
const ThemedApp = () => {
  // Get the theme mode from ThemeContext
  const { mode } = useTheme();
  
  // Create the appropriate theme based on mode
  const theme = createAppTheme(mode);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <CartProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />
          
          {/* Main layout with protected routes */}
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/login" />} />
            
            {/* Admin routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/create" element={<CreateUser />} />
              <Route path="users/:id/edit" element={<EditUser />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Customer routes */}
            <Route 
              path="/customer" 
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Navigate to="/customer/dashboard" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/checkout" 
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerCheckout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/order-history" 
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <OrderHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/settings" 
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerSettings />
                </ProtectedRoute>
              } 
            />
            
            {/* Restaurant admin routes */}
            <Route 
              path="/restaurant" 
              element={
                <ProtectedRoute allowedRoles={['restaurant-admin']}>
                  <RestaurantLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<RestaurantDashboard />} />
              <Route path="food-items" element={<FoodItems />} />
              <Route path="food-items/create" element={<CreateFoodItem />} />
              <Route path="food-items/edit/:id" element={<EditFoodItem />} />
              <Route path="settings" element={<RestaurantSettings />} />
            </Route>
            
            {/* Delivery personnel routes */}
            <Route 
              path="/delivery" 
              element={
                <ProtectedRoute allowedRoles={['delivery-personnel']}>
                  <DeliveryDashboard />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          {/* Redirect unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </CartProvider>
    </MuiThemeProvider>
  );
};

// Root App component wrapped in ThemeProvider
const App = () => (
  <ThemeProvider>
    <ThemedApp />
  </ThemeProvider>
);

export default App; 