import React, { createContext, useContext, useReducer, useEffect } from 'react';

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
  orderHistory: []
};

// Actions
const ADD_TO_CART = 'ADD_TO_CART';
const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
const UPDATE_QUANTITY = 'UPDATE_QUANTITY';
const CLEAR_CART = 'CLEAR_CART';
const SET_TIP = 'SET_TIP';
const SET_DELIVERY_FEE = 'SET_DELIVERY_FEE';
const ADD_TO_ORDER_HISTORY = 'ADD_TO_ORDER_HISTORY';

// Reducer function
const cartReducer = (state, action) => {
  switch (action.type) {
    case ADD_TO_CART: {
      const existingItemIndex = state.items.findIndex(
        item => item._id === action.payload._id
      );

      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + action.payload.quantity
        };

        return {
          ...state,
          items: updatedItems,
          total: calculateTotal(updatedItems)
        };
      } else {
        // New item, add to cart
        const newItems = [...state.items, action.payload];
        return {
          ...state,
          items: newItems,
          total: calculateTotal(newItems)
        };
      }
    }

    case REMOVE_FROM_CART: {
      const updatedItems = state.items.filter(item => item._id !== action.payload);
      return {
        ...state,
        items: updatedItems,
        total: calculateTotal(updatedItems)
      };
    }

    case UPDATE_QUANTITY: {
      const { itemId, quantity } = action.payload;
      const updatedItems = state.items.map(item => 
        item._id === itemId ? { ...item, quantity } : item
      );
      
      return {
        ...state,
        items: updatedItems,
        total: calculateTotal(updatedItems)
      };
    }

    case CLEAR_CART:
      return {
        ...initialState,
        orderHistory: state.orderHistory || [] // Preserve order history when clearing cart
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

    case ADD_TO_ORDER_HISTORY:
      return {
        ...state,
        orderHistory: [...(state.orderHistory || []), action.payload]
      };

    default:
      return state;
  }
};

// Helper function to calculate total
const calculateTotal = (items) => {
  if (!items || !items.length) return 0;
  return items.reduce((total, item) => {
    const price = item.price || 0;
    const quantity = item.quantity || 0;
    return total + (price * quantity);
  }, 0);
};

// Create context
const CartContext = createContext();

// Provider component
export const CartProvider = ({ children }) => {
  // Load cart from localStorage on initial render
  const loadInitialState = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Ensure required properties always exist
        return {
          ...initialState,  // First apply initialState to ensure all properties exist
          ...parsedCart,    // Then override with saved values
          total: parsedCart.total || 0,
          items: parsedCart.items || [],
          orderHistory: parsedCart.orderHistory || []  // Ensure orderHistory always exists
        };
      }
      return initialState;
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return initialState;
    }
  };

  const [state, dispatch] = useReducer(cartReducer, null, loadInitialState);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [state]);

  // Action creators
  const addToCart = (item) => {
    dispatch({ type: ADD_TO_CART, payload: item });
  };

  const removeFromCart = (itemId) => {
    dispatch({ type: REMOVE_FROM_CART, payload: itemId });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({ type: UPDATE_QUANTITY, payload: { itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: CLEAR_CART });
  };

  const setTip = (tipData) => {
    dispatch({ type: SET_TIP, payload: tipData });
  };

  const setDeliveryFee = (deliveryData) => {
    dispatch({ type: SET_DELIVERY_FEE, payload: deliveryData });
  };

  // Action for adding to order history
  const addToOrderHistory = (orderDetails) => {
    dispatch({ 
      type: ADD_TO_ORDER_HISTORY, 
      payload: {
        ...orderDetails,
        id: Date.now().toString(), // Generate a unique ID
        date: new Date().toISOString(),
        status: 'Placed'
      } 
    });
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
        addToOrderHistory
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