import api from './api';

// Order service for handling order operations
const orderService = {
  // Get all orders for the current user
  getUserOrders: async () => {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },
  
  // Get a single order by ID
  getOrderById: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },
  
  // Create a new order
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },
  
  // Update order payment status
  updateOrderPayment: async (orderId, paymentData) => {
    try {
      const response = await api.put(`/orders/${orderId}/payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error updating order payment:', error);
      throw error;
    }
  },
  
  // Delete an order
  deleteOrder: async (orderId) => {
    try {
      const response = await api.delete(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }
};

export default orderService; 