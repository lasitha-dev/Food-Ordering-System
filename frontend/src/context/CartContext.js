import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import cartService from '../services/cartService';
import orderService from '../services/orderService';

// Helper function to check if user is authenticated
const isUserAuthenticated = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return !!token; // Convert to boolean
};

// Initial state for cart
const initialState = {
  items: [],
  total: 0,
  delivery: {
    fee: 0,
    free: false
  },
  tip: {
    amount: 0,
    percentage: 0
  },
  loading: false,
  error: null,
  orderHistory: []
};

// Actions
const ADD_TO_CART = 'ADD_TO_CART';
const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
const UPDATE_QUANTITY = 'UPDATE_QUANTITY';
const CLEAR_CART = 'CLEAR_CART';
const SET_TIP = 'SET_TIP';
const SET_DELIVERY_FEE = 'SET_DELIVERY_FEE';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';
const SET_CART = 'SET_CART';
const FETCH_ORDERS_SUCCESS = 'FETCH_ORDERS_SUCCESS';
const CREATE_ORDER_SUCCESS = 'CREATE_ORDER_SUCCESS';
const UPDATE_ORDER_PAYMENT = 'UPDATE_ORDER_PAYMENT';
const REMOVE_ORDER = 'REMOVE_ORDER';

// Reducer function
const cartReducer = (state, action) => {
  switch (action.type) {
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
      
    case SET_CART:
      return {
        ...state,
        items: action.payload.items || [],
        total: action.payload.total || 0,
        delivery: action.payload.delivery || {
          fee: 0,
          free: false
        },
        tip: action.payload.tip || {
          amount: 0,
          percentage: 0
        },
        loading: false
      };

    case ADD_TO_CART:
      // This is now handled by the API
      return state;

    case REMOVE_FROM_CART:
      // This is now handled by the API
      return state;

    case UPDATE_QUANTITY:
      // This is now handled by the API
      return state;

    case CLEAR_CART:
      // This is now handled by the API
      return {
        ...state,
        items: [],
        total: 0
      };

    case SET_TIP:
      return {
        ...state,
        tip: action.payload
      };

    case SET_DELIVERY_FEE:
      return {
        ...state,
        delivery: action.payload
      };
      
    case FETCH_ORDERS_SUCCESS:
      return {
        ...state,
        orderHistory: action.payload,
        loading: false
      };
      
    case CREATE_ORDER_SUCCESS:
      return {
        ...state,
        orderHistory: [...(state.orderHistory || []), action.payload],
        loading: false
      };
      
    case UPDATE_ORDER_PAYMENT:
      return {
        ...state,
        orderHistory: (state.orderHistory || []).map(order => 
          order._id === action.payload.orderId
            ? { 
                ...order, 
                paymentStatus: 'paid',
                paymentId: action.payload.paymentId,
                paymentDate: action.payload.paymentDate 
              }
            : order
        ),
        loading: false
      };
      
    case REMOVE_ORDER:
      return {
        ...state,
        orderHistory: (state.orderHistory || []).filter(order => order._id !== action.payload),
        loading: false
      };

    default:
      return state;
  }
};

// Create context
const CartContext = createContext();

// Provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isUserAuthenticated();
      setIsAuthenticated(authenticated);
      console.log('Cart authentication check:', authenticated ? 'User is authenticated' : 'User is not authenticated');
    };
    
    // Initial check
    checkAuth();
    
    // Listen for storage changes that might affect authentication
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'accessToken' || e.key === 'refreshToken') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Periodic check for auth status
    const authCheckInterval = setInterval(checkAuth, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(authCheckInterval);
    };
  }, []);
  
  // Load cart data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User authenticated, fetching cart and orders');
      fetchCart();
      fetchOrders();
    } else {
      console.log('User not authenticated, skipping cart and order fetch');
    }
  }, [isAuthenticated]);
  
  // Fetch cart from API
  const fetchCart = async () => {
    if (!isAuthenticated) {
      console.warn('Attempted to fetch cart while not authenticated');
      return;
    }
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      console.log('Fetching cart data from API');
      const response = await cartService.getUserCart();
      
      // Handle different response formats
      let cartData;
      if (response.data && response.success !== false) {
        cartData = response.data;
        console.log('Cart data received (standard format):', cartData);
      } else if (response.success === true && response.data && response.data.data) {
        cartData = response.data.data;
        console.log('Cart data received (nested format):', cartData);
      } else {
        console.error('Invalid cart response format:', response);
        dispatch({ type: SET_ERROR, payload: 'Invalid cart data format' });
        return;
      }
      
      // Dispatch the data to update state
      dispatch({ type: SET_CART, payload: cartData });
    } catch (error) {
      console.error('Error fetching cart:', error);
      
      // Create an empty cart state if the error is due to cart not being found
      if (error.response?.status === 404) {
        console.log('Cart not found, initializing empty cart');
        dispatch({ 
          type: SET_CART, 
          payload: {
            items: [],
            total: 0,
            delivery: { fee: 0, free: false },
            tip: { amount: 0, percentage: 0 }
          } 
        });
      } else {
        dispatch({ type: SET_ERROR, payload: error.message });
      }
    }
  };
  
  // Fetch order history
  const fetchOrders = async () => {
    if (!isAuthenticated) {
      console.warn('Attempted to fetch orders while not authenticated');
      return;
    }
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      console.log('Fetching order history from API');
      const response = await orderService.getUserOrders();
      console.log('Order history API response:', response);
      
      if (!response) {
        console.error('Invalid orders response format: response is null or undefined');
        dispatch({ type: SET_ERROR, payload: 'Invalid orders data format' });
        return;
      }
      
      // Handle various possible response formats
      let ordersData = [];
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Order history is directly in response.data array');
        ordersData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log('Order history is in nested response.data.data array');
        ordersData = response.data.data;
      } else if (response.data && response.success !== false) {
        console.log('Attempting to extract orders from non-standard format');
        // Try to extract any array we can find
        if (Array.isArray(response.data)) {
          ordersData = response.data;
        }
      } else {
        console.error('Could not find orders array in response:', response);
        // Provide empty array as fallback
        ordersData = [];
      }
      
      console.log('Order history extracted:', ordersData);
      dispatch({ type: FETCH_ORDERS_SUCCESS, payload: ordersData });
    } catch (error) {
      console.error('Error fetching orders:', error);
      dispatch({ type: SET_ERROR, payload: error.message || 'Error fetching orders' });
      // Provide empty array on error
      dispatch({ type: FETCH_ORDERS_SUCCESS, payload: [] });
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  };

  // Backup method to try multiple ways of getting orders
  const loadUserOrders = async () => {
    if (!isAuthenticated) {
      console.warn('Attempted to load user orders while not authenticated');
      return [];
    }
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      // Try normal fetch first
      console.log('Attempting to load user orders through standard API');
      const response = await orderService.getUserOrders();
      
      if (response && response.data) {
        let ordersData = [];
        
        if (Array.isArray(response.data)) {
          ordersData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          ordersData = response.data.data;
        }
        
        if (ordersData.length > 0) {
          console.log('Successfully loaded orders through standard API:', ordersData.length);
          dispatch({ type: FETCH_ORDERS_SUCCESS, payload: ordersData });
          return ordersData;
        }
      }
      
      console.log('Standard API did not return valid orders, trying secondary endpoints');
      
      // Try alternative endpoint - this is a backup mechanism
      // You may implement more fallback methods here based on your API structure
      
      // If all else fails, at least return what we have in state
      console.log('Using existing order history as fallback');
      return state.orderHistory || [];
      
    } catch (error) {
      console.error('Error in loadUserOrders:', error);
      return state.orderHistory || [];
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  };

  // Add item to cart
  const addToCart = async (item) => {
    if (!isAuthenticated) {
      console.warn('Attempted to add to cart while not authenticated');
      return;
    }
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      console.log('Adding item to cart:', item);
      await cartService.addItemToCart(item);
      // Refresh cart after update
      fetchCart();
    } catch (error) {
      console.error('Error adding item to cart:', error);
      dispatch({ type: SET_ERROR, payload: error.message });
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    if (!isAuthenticated) {
      console.warn('Attempted to remove from cart while not authenticated');
      return;
    }
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      console.log('Removing item from cart:', itemId);
      await cartService.removeCartItem(itemId);
      // Refresh cart after update
      fetchCart();
    } catch (error) {
      console.error('Error removing item from cart:', error);
      dispatch({ type: SET_ERROR, payload: error.message });
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    if (!isAuthenticated) {
      console.warn('Attempted to update quantity while not authenticated');
      return;
    }
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      console.log('Updating item quantity:', itemId, quantity);
      await cartService.updateItemQuantity(itemId, quantity);
      // Refresh cart after update
      fetchCart();
    } catch (error) {
      console.error('Error updating item quantity:', error);
      dispatch({ type: SET_ERROR, payload: error.message });
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!isAuthenticated) {
      console.warn('Attempted to clear cart while not authenticated');
      return;
    }
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      console.log('Clearing cart');
      await cartService.clearCart();
      dispatch({ type: CLEAR_CART });
    } catch (error) {
      console.error('Error clearing cart:', error);
      dispatch({ type: SET_ERROR, payload: error.message });
    }
  };

  // Set tip amount and percentage
  const setTip = async (tipData) => {
    if (!isAuthenticated) {
      console.warn('Attempted to set tip while not authenticated');
      return;
    }
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      console.log('Setting tip data:', tipData);
      await cartService.updateCartDetails({ tip: tipData });
      dispatch({ type: SET_TIP, payload: tipData });
      // Refresh cart to get updated totals
      fetchCart();
    } catch (error) {
      console.error('Error setting tip:', error);
      dispatch({ type: SET_ERROR, payload: error.message });
    }
  };

  // Set delivery fee
  const setDeliveryFee = async (deliveryData) => {
    if (!isAuthenticated) {
      console.warn('Attempted to set delivery fee while not authenticated');
      return;
    }
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      console.log('Setting delivery data:', deliveryData);
      await cartService.updateCartDetails({ delivery: deliveryData });
      dispatch({ type: SET_DELIVERY_FEE, payload: deliveryData });
      // Refresh cart to get updated totals
      fetchCart();
    } catch (error) {
      console.error('Error setting delivery fee:', error);
      dispatch({ type: SET_ERROR, payload: error.message });
    }
  };

  // Add order to history
  const addToOrderHistory = async (orderDetails) => {
    if (!isAuthenticated) {
      console.warn('Attempted to create order while not authenticated');
      return null;
    }
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      console.log('Creating new order via API:', orderDetails);
      const response = await orderService.createOrder(orderDetails);
      console.log('Raw order API response:', response);
      
      // Handle different possible response formats
      let order;
      
      if (response && response.data) {
        if (response.data.data) {
          // Format: { data: { data: {...} } }
          order = response.data.data;
          console.log('Order created successfully with nested data format:', order);
        } else if (response.data.success !== false) {
          // Format: { data: {...} }
          order = response.data;
          console.log('Order created successfully with standard data format:', order);
        }
      }
      
      if (order) {
        dispatch({ 
          type: CREATE_ORDER_SUCCESS, 
          payload: order
        });
        
        // Clear cart after order is created
        dispatch({ type: CLEAR_CART });
        
        return order;
      } else {
        console.error('Invalid order API response format - using fallback:', response);
        // Create a fallback order object to continue the flow
        const fallbackOrder = {
          _id: `temp_${Date.now()}`,
          items: orderDetails.items,
          total: orderDetails.total,
          subtotal: orderDetails.subtotal,
          deliveryFee: orderDetails.deliveryFee,
          tip: orderDetails.tip,
          deliveryAddress: orderDetails.deliveryAddress,
          paymentMethod: orderDetails.paymentMethod,
          createdAt: new Date().toISOString(),
          status: 'Placed',
          paymentStatus: orderDetails.paymentMethod === 'cash' ? 'pending' : 'unpaid'
        };
        
        dispatch({ 
          type: CREATE_ORDER_SUCCESS, 
          payload: fallbackOrder
        });
        
        // Still clear the cart
        dispatch({ type: CLEAR_CART });
        
        return fallbackOrder;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      dispatch({ type: SET_ERROR, payload: error.message || 'Failed to create order' });
      return null;
    } finally {
      // Ensure loading state is reset
      setTimeout(() => {
        dispatch({ type: SET_LOADING, payload: false });
      }, 500);
    }
  };

  // Update order payment status
  const updateOrderPayment = async (orderId, paymentDetails) => {
    if (!isAuthenticated) {
      console.warn('Attempted to update payment while not authenticated');
      return false;
    }
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      console.log('Updating order payment:', orderId, paymentDetails);
      const response = await orderService.updateOrderPayment(orderId, paymentDetails);
      
      dispatch({
        type: UPDATE_ORDER_PAYMENT,
        payload: {
          orderId,
          paymentId: paymentDetails.paymentId,
          paymentDate: new Date().toISOString()
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error updating order payment:', error);
      dispatch({ type: SET_ERROR, payload: error.message });
      return false;
    }
  };

  // Remove order from history
  const removeOrderFromHistory = async (orderId) => {
    if (!isAuthenticated) {
      console.warn('Attempted to remove order while not authenticated');
      return false;
    }
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      console.log('Removing order:', orderId);
      const response = await orderService.deleteOrder(orderId);
      console.log('Delete order response:', response);
      
      // Update local state
      dispatch({
        type: REMOVE_ORDER,
        payload: orderId
      });
      
      // Ensure loading state is reset
      dispatch({ type: SET_LOADING, payload: false });
      
      return true;
    } catch (error) {
      console.error('Error removing order:', error);
      dispatch({ type: SET_ERROR, payload: error.message });
      
      // Ensure loading state is reset
      dispatch({ type: SET_LOADING, payload: false });
      
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        // Cart data
        cart: {
          items: state.items,
          total: state.total,
          delivery: state.delivery,
          tip: state.tip
        },
        orderHistory: state.orderHistory,
        loading: state.loading,
        error: state.error,
        isAuthenticated,
        
        // Cart actions
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setTip,
        setDeliveryFee,
        
        // Order actions
        fetchOrders,
        loadUserOrders,
        addToOrderHistory,
        updateOrderPayment,
        removeOrderFromHistory
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext; 