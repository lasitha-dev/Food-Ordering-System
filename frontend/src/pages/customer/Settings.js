import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Edit as EditIcon, Camera as CameraIcon, Save as SaveIcon } from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import CustomerLayout from '../../components/layouts/CustomerLayout';
import addressService from '../../services/addressService';

const Settings = () => {
  const { currentUser, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    isDefaultAddress: false
  });
  
  const [profilePic, setProfilePic] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [successAlert, setSuccessAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = React.useRef(null);
  
  // Initialize form data with currentUser data when component mounts or currentUser changes
  useEffect(() => {
    if (currentUser) {
      console.log('Current user data in Settings:', currentUser);
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        isDefaultAddress: currentUser.defaultDeliveryAddress === currentUser.address
      });
      setProfilePic(currentUser.profilePic || currentUser.profilePicture || null);
    }
  }, [currentUser]);
  
  // Fetch default address
  useEffect(() => {
    const fetchDefaultAddress = async () => {
      try {
        const defaultAddress = await addressService.getDefaultAddress();
        if (defaultAddress) {
          setFormData(prev => ({
            ...prev,
            address: defaultAddress.fullAddress || defaultAddress.address || '',
            isDefaultAddress: true
          }));
        }
      } catch (error) {
        console.error('Error fetching default address:', error);
      }
    };
    
    fetchDefaultAddress();
  }, []);
  
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleProfilePicClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        // Preview the image
        setPreviewImage(reader.result);
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Update the user profile
      const updatedUser = {
        ...currentUser,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        profilePic: previewImage || profilePic,
        profilePicture: previewImage || profilePic, // Add both variants for consistency
        defaultDeliveryAddress: formData.isDefaultAddress ? formData.address : null
      };
      
      // Directly update localStorage userProfile to ensure data persists
      try {
        const userProfileStr = localStorage.getItem('userProfile') || '{}';
        const userProfile = JSON.parse(userProfileStr);
        
        const updatedProfile = {
          ...userProfile,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          profilePic: previewImage || profilePic,
          profilePicture: previewImage || profilePic,
          defaultDeliveryAddress: formData.isDefaultAddress ? formData.address : null
        };
        
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        console.log('Updated userProfile in localStorage:', updatedProfile);
      } catch (localStorageError) {
        console.error('Error updating localStorage:', localStorageError);
      }
      
      // Call the updateProfile function from auth context
      const result = await updateProfile(updatedUser);
      console.log('Profile update result:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update profile');
      }
      
      // Set default address if checkbox is checked
      if (formData.isDefaultAddress) {
        try {
          // Check if address already exists in system
          const addressesResponse = await addressService.getUserAddresses();
          const addresses = addressesResponse.data?.data || [];
          
          const existingAddress = addresses.find(addr => 
            addr.fullAddress === formData.address || addr.address === formData.address
          );
          
          if (existingAddress) {
            // If address exists, set it as default
            await addressService.setDefaultAddress(existingAddress.id);
          } else {
            // If address doesn't exist, create it as default
            await addressService.createAddress({
              fullAddress: formData.address,
              isDefault: true
            });
          }
        } catch (addressError) {
          console.error('Error setting default address:', addressError);
        }
      }
      
      setSuccessAlert(true);
      // Update the displayed profile pic
      setProfilePic(previewImage || profilePic);
      setPreviewImage(null);
    } catch (err) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Account Settings
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ position: 'relative', mb: 2, display: 'inline-block' }}>
                <Avatar
                  src={previewImage || profilePic || ""}
                  alt={formData.firstName}
                  sx={{ width: 120, height: 120, mb: 2, mx: 'auto' }}
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    right: -10,
                    bottom: 15,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                  size="small"
                  onClick={handleProfilePicClick}
                >
                  <CameraIcon fontSize="small" />
                </IconButton>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </Box>
              
              <Typography variant="h6">
                {formData.firstName} {formData.lastName}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {formData.email}
              </Typography>
              
              {(previewImage || formData.firstName !== currentUser?.firstName || 
               formData.lastName !== currentUser?.lastName ||
               formData.email !== currentUser?.email ||
               formData.phone !== currentUser?.phone ||
               formData.address !== currentUser?.address) && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  startIcon={<SaveIcon />}
                  sx={{ mt: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : "Save Changes"}
                </Button>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      variant="outlined"
                      margin="normal"
                      type="email"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Delivery Information
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Default Delivery Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      variant="outlined"
                      margin="normal"
                      multiline
                      rows={2}
                    />
                    
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.isDefaultAddress}
                          onChange={handleChange}
                          name="isDefaultAddress"
                          color="primary"
                        />
                      }
                      label="Set as default delivery address for checkout"
                    />
                  </Grid>
                </Grid>
                
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
                
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  sx={{ mt: 3 }}
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : "Save Changes"}
                </Button>
              </form>
            </Paper>
          </Grid>
        </Grid>
        
        <Snackbar
          open={successAlert}
          autoHideDuration={6000}
          onClose={() => setSuccessAlert(false)}
        >
          <Alert onClose={() => setSuccessAlert(false)} severity="success">
            Profile updated successfully!
          </Alert>
        </Snackbar>
      </Box>
    </CustomerLayout>
  );
};

export default Settings; 