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
import RestaurantOrders from './pages/restaurant/Orders';

// Delivery personnel pages
import DeliveryDashboard from './pages/delivery/Dashboard';

// Custom theme builder function that accepts mode (light/dark)
const createAppTheme = (mode) => createTheme({
  palette: {
    mode, // This sets the theme mode to 'light' or 'dark'
    primary: {
      light: '#FF8A65', // Softer orange
      main: '#FF5722', // Warm orange (food-friendly)
      dark: '#E64A19', 
      contrastText: '#fff',
    },
    secondary: {
      light: '#4DB6AC', // Teal light
      main: '#26A69A', // Teal (complementary to orange)
      dark: '#00897B',
      contrastText: '#fff',
    },
    success: {
      light: '#81C784',
      main: '#66BB6A',
      dark: '#388E3C',
    },
    warning: {
      light: '#FFB74D',
      main: '#FFA000',
      dark: '#F57C00',
    },
    error: {
      light: '#E57373',
      main: '#F44336',
      dark: '#D32F2F',
    },
    info: {
      light: '#4FC3F7',
      main: '#29B6F6',
      dark: '#0288D1',
    },
    background: {
      default: mode === 'light' ? '#F9FAFB' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      subtle: mode === 'light' ? '#F3F4F6' : '#252525',
    },
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    text: {
      primary: mode === 'light' ? '#1F2937' : '#F9FAFB',
      secondary: mode === 'light' ? '#6B7280' : '#9CA3AF',
      disabled: mode === 'light' ? '#9CA3AF' : '#6B7280',
    },
    divider: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.2,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.2,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.2,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.2,
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.57,
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.57,
    },
    button: {
      fontWeight: 600,
      fontSize: '0.875rem',
      textTransform: 'none',
      lineHeight: 1.75,
    },
    caption: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.66,
    },
    overline: {
      fontWeight: 600,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      lineHeight: 2.5,
      letterSpacing: 1,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 6px 12px rgba(0, 0, 0, 0.1)',
    '0px 8px 16px rgba(0, 0, 0, 0.12)',
    '0px 10px 20px rgba(0, 0, 0, 0.14)',
    '0px 12px 24px rgba(0, 0, 0, 0.16)',
    '0px 14px 28px rgba(0, 0, 0, 0.18)',
    '0px 16px 32px rgba(0, 0, 0, 0.2)',
    '0px 18px 36px rgba(0, 0, 0, 0.22)',
    '0px 20px 40px rgba(0, 0, 0, 0.24)',
    '0px 22px 44px rgba(0, 0, 0, 0.26)',
    '0px 24px 48px rgba(0, 0, 0, 0.28)',
    '0px 26px 52px rgba(0, 0, 0, 0.3)',
    '0px 28px 56px rgba(0, 0, 0, 0.32)',
    '0px 30px 60px rgba(0, 0, 0, 0.34)',
    '0px 32px 64px rgba(0, 0, 0, 0.36)',
    '0px 34px 68px rgba(0, 0, 0, 0.38)',
    '0px 36px 72px rgba(0, 0, 0, 0.4)',
    '0px 38px 76px rgba(0, 0, 0, 0.42)',
    '0px 40px 80px rgba(0, 0, 0, 0.44)',
    '0px 42px 84px rgba(0, 0, 0, 0.46)',
    '0px 44px 88px rgba(0, 0, 0, 0.48)',
    '0px 46px 92px rgba(0, 0, 0, 0.5)',
    '0px 48px 96px rgba(0, 0, 0, 0.52)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          fontWeight: 600,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          backgroundImage: 'linear-gradient(135deg, #FF7043 0%, #FF5722 100%)',
          '&:hover': {
            backgroundImage: 'linear-gradient(135deg, #FF5722 0%, #E64A19 100%)',
          },
        },
        containedSecondary: {
          backgroundImage: 'linear-gradient(135deg, #4DB6AC 0%, #26A69A 100%)',
          '&:hover': {
            backgroundImage: 'linear-gradient(135deg, #26A69A 0%, #00897B 100%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: mode === 'light' ? 'rgba(255, 87, 34, 0.08)' : 'rgba(255, 87, 34, 0.12)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.08)',
          borderRadius: 16,
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 12px 28px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s ease-in-out',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? '#FF5722' : '#FF7043',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
            },
          },
          '& .MuiInputLabel-root': {
            '&.Mui-focused': {
              color: mode === 'light' ? '#FF5722' : '#FF7043',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.08)',
          backgroundImage: mode === 'light' 
            ? 'linear-gradient(135deg, #FF7043 0%, #FF5722 100%)'
            : 'linear-gradient(135deg, #424242 0%, #212121 100%)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
          '&.MuiChip-colorPrimary': {
            backgroundImage: 'linear-gradient(135deg, #FF7043 0%, #FF5722 100%)',
          },
          '&.MuiChip-colorSecondary': {
            backgroundImage: 'linear-gradient(135deg, #4DB6AC 0%, #26A69A 100%)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: mode === 'light' ? '#F3F4F6' : '#252525',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 16px',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '24px 0',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: mode === 'light' ? 'rgba(255, 87, 34, 0.08)' : 'rgba(255, 87, 34, 0.16)',
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(255, 87, 34, 0.12)' : 'rgba(255, 87, 34, 0.24)',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderTopRightRadius: 16,
          borderBottomRightRadius: 16,
        },
      },
    },
  },
});

// Customer Routes component wrapped with CartProvider
const CustomerRoutes = () => (
  <CartProvider>
    <Routes>
      <Route path="dashboard" element={<CustomerDashboard />} />
      <Route path="checkout" element={<CustomerCheckout />} />
      <Route path="order-history" element={<OrderHistory />} />
      <Route path="settings" element={<CustomerSettings />} />
      <Route index element={<Navigate to="dashboard" />} />
    </Routes>
  </CartProvider>
);

// Theme-aware App component
const ThemedApp = () => {
  // Get the theme mode from ThemeContext
  const { mode } = useTheme();
  
  // Create the appropriate theme based on mode
  const theme = createAppTheme(mode);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
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
                {console.log('Rendering AdminLayout component')}
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
          
          {/* Customer routes - wrapped with CartProvider */}
          <Route 
            path="/customer/*" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerRoutes />
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
            <Route path="orders" element={<RestaurantOrders />} />
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