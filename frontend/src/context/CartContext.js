import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import cartService from '../services/cartService';
import orderService from '../services/orderService';

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
  error: null
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
    const token = localStorage.getItem('accessToken');
    setIsAuthenticated(!!token);
  }, []);
  
  // Load cart data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      fetchOrders();
    }
  }, [isAuthenticated]);
  
  // Fetch cart from API
  const fetchCart = async () => {
    if (!isAuthenticated) return;
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      const response = await cartService.getUserCart();
      dispatch({ type: SET_CART, payload: response.data });
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      console.error('Error fetching cart:', error);
    }
  };
  
  // Fetch orders from API
  const fetchOrders = async () => {
    if (!isAuthenticated) return;
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      const response = await orderService.getUserOrders();
      dispatch({ type: FETCH_ORDERS_SUCCESS, payload: response.data });
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      console.error('Error fetching orders:', error);
    }
  };

  // Action creators
  const addToCart = async (item) => {
    if (!isAuthenticated) return;
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      await cartService.addItemToCart(item);
      // Refresh cart after update
      fetchCart();
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      console.error('Error adding item to cart:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    if (!isAuthenticated) return;
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      await cartService.removeCartItem(itemId);
      // Refresh cart after update
      fetchCart();
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      console.error('Error removing item from cart:', error);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (!isAuthenticated) return;
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      await cartService.updateItemQuantity(itemId, quantity);
      // Refresh cart after update
      fetchCart();
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      console.error('Error updating item quantity:', error);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      await cartService.clearCart();
      dispatch({ type: CLEAR_CART });
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      console.error('Error clearing cart:', error);
    }
  };

  const setTip = async (tipData) => {
    if (!isAuthenticated) return;
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      await cartService.updateCartDetails({ tip: tipData });
      dispatch({ type: SET_TIP, payload: tipData });
      // Refresh cart to get updated total
      fetchCart();
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      console.error('Error setting tip:', error);
    }
  };

  const setDeliveryFee = async (deliveryData) => {
    if (!isAuthenticated) return;
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      await cartService.updateCartDetails({ delivery: deliveryData });
      dispatch({ type: SET_DELIVERY_FEE, payload: deliveryData });
      // Refresh cart to get updated total
      fetchCart();
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      console.error('Error setting delivery fee:', error);
    }
  };

  // Action for adding to order history
  const addToOrderHistory = async (orderDetails) => {
    if (!isAuthenticated) return;
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      const response = await orderService.createOrder(orderDetails);
      dispatch({ 
        type: CREATE_ORDER_SUCCESS, 
        payload: response.data
      });
      return response.data;
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      console.error('Error creating order:', error);
      throw error;
    }
  };
  
  // Action for updating order payment
  const updateOrderPayment = async (orderId, paymentDetails) => {
    if (!isAuthenticated) return;
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      const response = await orderService.updateOrderPayment(orderId, paymentDetails);
      dispatch({
        type: UPDATE_ORDER_PAYMENT,
        payload: {
          orderId,
          paymentId: paymentDetails.paymentId,
          paymentDate: new Date().toISOString()
        }
      });
      return response.data;
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      console.error('Error updating order payment:', error);
      throw error;
    }
  };
  
  // Action for removing an order from history
  const removeOrderFromHistory = async (orderId) => {
    if (!isAuthenticated) return;
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      await orderService.deleteOrder(orderId);
      dispatch({
        type: REMOVE_ORDER,
        payload: orderId
      });
    } catch (error) {
      dispatch({ type: SET_ERROR, payload: error.message });
      console.error('Error removing order:', error);
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart: state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setTip,
        setDeliveryFee,
        addToOrderHistory,
        updateOrderPayment,
        removeOrderFromHistory,
        fetchCart,
        fetchOrders
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