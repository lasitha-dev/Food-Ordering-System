import api from './api';

// Cart service for handling cart operations
const cartService = {
  // Get the current user's cart
  getUserCart: async () => {
    try {
      console.log('Fetching user cart from API');
      const response = await api.get('/cart');
      console.log('Cart fetch response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Add item to cart
  addItemToCart: async (item) => {
    try {
      // Validate required fields
      if (!item._id || !item.title || item.price === undefined || !item.quantity) {
        throw new Error('Missing required fields for cart item');
      }
      
      // Ensure numeric fields are actually numbers
      const validatedItem = {
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity)
      };
      
      console.log('Adding item to cart:', validatedItem);
      const response = await api.post('/cart/items', validatedItem);
      console.log('Add to cart response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding item to cart:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Update item quantity in cart
  updateItemQuantity: async (itemId, quantity) => {
    try {
      if (!itemId) {
        throw new Error('Item ID is required');
      }
      
      console.log(`Updating quantity for item ${itemId} to ${quantity}`);
      const response = await api.put(`/cart/items/${itemId}`, { quantity: Number(quantity) });
      console.log('Update quantity response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating item quantity:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Remove item from cart
  removeCartItem: async (itemId) => {
    try {
      if (!itemId) {
        throw new Error('Item ID is required');
      }
      
      console.log(`Removing item ${itemId} from cart`);
      const response = await api.delete(`/cart/items/${itemId}`);
      console.log('Remove item response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error removing item from cart:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Clear cart (remove all items)
  clearCart: async () => {
    try {
      console.log('Clearing cart');
      const response = await api.delete('/cart');
      console.log('Clear cart response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Update cart details (delivery fee, tip)
  updateCartDetails: async (details) => {
    try {
      console.log('Updating cart details:', details);
      const response = await api.put('/cart/details', details);
      console.log('Update cart details response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating cart details:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default cartService; 