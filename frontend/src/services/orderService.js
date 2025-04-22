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
  
  // Get all orders for restaurant admin (paid or cash on delivery)
  getRestaurantOrders: async () => {
    try {
      const response = await api.get('/orders/restaurant');
      return response.data;
    } catch (error) {
      console.error('Error fetching restaurant orders:', error);
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
      console.log('Order service: Attempting to delete order with ID:', orderId);
      const response = await api.delete(`/orders/${orderId}`);
      console.log('Order service: Delete order response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Order service: Error deleting order:', error);
      console.error('Order service: Error details:', {
        status: error.response?.status,
        message: error.message,
        responseData: error.response?.data
      });
      throw error;
    }
  },
  
  // Update order status (for restaurant admin)
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
};

export default orderService; 