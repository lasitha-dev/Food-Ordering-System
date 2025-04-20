import api from './api';

// Cart service for handling cart operations
const cartService = {
  // Get the current user's cart
  getUserCart: async () => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },
  
  // Add item to cart
  addItemToCart: async (item) => {
    try {
      const response = await api.post('/cart/items', item);
      return response.data;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  },
  
  // Update item quantity in cart
  updateItemQuantity: async (itemId, quantity) => {
    try {
      const response = await api.put(`/cart/items/${itemId}`, { quantity });
      return response.data;
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  },
  
  // Remove item from cart
  removeCartItem: async (itemId) => {
    try {
      const response = await api.delete(`/cart/items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  },
  
  // Clear cart (remove all items)
  clearCart: async () => {
    try {
      const response = await api.delete('/cart');
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },
  
  // Update cart details (delivery fee, tip)
  updateCartDetails: async (details) => {
    try {
      const response = await api.put('/cart/details', details);
      return response.data;
    } catch (error) {
      console.error('Error updating cart details:', error);
      throw error;
    }
  }
};

export default cartService; 