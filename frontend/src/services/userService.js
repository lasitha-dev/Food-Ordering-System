import api from './api';

// User service for fetching user data
const userService = {
  // Get all delivery personnel
  getDeliveryPersonnel: async () => {
    try {
      console.log('Requesting delivery personnel from API');
      
      // First try the official endpoint
      try {
        console.log('Trying official endpoint: /users/delivery-personnel');
        const response = await api.get('/users/delivery-personnel');
        console.log('Successful response from official endpoint');
        
        if (response.data && (Array.isArray(response.data.data) || Array.isArray(response.data))) {
          // Handle both direct array response and nested data object
          const personnelData = Array.isArray(response.data) 
            ? response.data 
            : response.data.data;
          
          return {
            success: true,
            data: personnelData
          };
        }
      } catch (endpointError) {
        console.log('Official endpoint failed:', endpointError.message);
        // If that fails, use the mock data as fallback
      }
      
      // If we reach here, use mock data
      console.log('Using mock data for delivery personnel');
      return {
        success: true,
        data: userService.getMockDeliveryPersonnel(),
        isMockData: true
      };
    } catch (error) {
      console.error('Error fetching delivery personnel:', error);
      return {
        success: true,
        data: userService.getMockDeliveryPersonnel(),
        isMockData: true
      };
    }
  },
  
  // Get user profile
  getUserProfile: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  
  // Generate mock delivery personnel for testing purposes
  getMockDeliveryPersonnel: () => {
    console.log('Creating mock delivery personnel data');
    return [
      { _id: 'dp1', name: 'John Delivery', phone: '555-1234', available: true },
      { _id: 'dp2', name: 'Alice Rider', phone: '555-5678', available: true },
      { _id: 'dp3', name: 'Bob Courier', phone: '555-9012', available: true }
    ];
  }
};

export default userService; 