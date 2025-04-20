import api from './api';

// Address service for handling user address operations
const addressService = {
  // Get all addresses for the current user
  getUserAddresses: async () => {
    try {
      const response = await api.get('/addresses');
      return response.data;
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw error;
    }
  },
  
  // Get a single address by ID
  getAddressById: async (addressId) => {
    try {
      const response = await api.get(`/addresses/${addressId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching address:', error);
      throw error;
    }
  },
  
  // Create a new address
  createAddress: async (addressData) => {
    try {
      const response = await api.post('/addresses', addressData);
      return response.data;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  },
  
  // Update an address
  updateAddress: async (addressId, addressData) => {
    try {
      const response = await api.put(`/addresses/${addressId}`, addressData);
      return response.data;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  },
  
  // Delete an address
  deleteAddress: async (addressId) => {
    try {
      const response = await api.delete(`/addresses/${addressId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  },
  
  // Set an address as default
  setDefaultAddress: async (addressId) => {
    try {
      const response = await api.put(`/addresses/${addressId}/default`);
      return response.data;
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  },
  
  // Get the default address for the current user
  getDefaultAddress: async () => {
    try {
      const response = await api.get('/addresses');
      const addresses = response.data.data;
      
      // Find the default address
      const defaultAddress = addresses.find(address => address.isDefault);
      
      return defaultAddress || null;
    } catch (error) {
      console.error('Error fetching default address:', error);
      throw error;
    }
  }
};

export default addressService; 