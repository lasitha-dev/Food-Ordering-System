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
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Camera as CameraIcon, Save as SaveIcon } from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import CustomerLayout from '../../components/layouts/CustomerLayout';

const Settings = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
  });
  
  const [profilePic, setProfilePic] = useState(currentUser?.profilePic || null);
  const [previewImage, setPreviewImage] = useState(null);
  const [successAlert, setSuccessAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = React.useRef(null);
  
  useEffect(() => {
    // Update form when currentUser changes (like after saving)
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
      });
      setProfilePic(currentUser.profilePic || null);
    }
  }, [currentUser]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
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
      // In a real implementation, you would call your API service here
      // For demo purposes, we'll simulate a successful update
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save user info to localStorage to persist between sessions
      const updatedUser = {
        ...currentUser,
        ...formData,
        profilePic: previewImage || profilePic,
        // Store the address in localStorage so checkout can access it
        defaultDeliveryAddress: formData.address
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // If you had a real updateUserProfile function, you'd call it like:
      // await updateUserProfile(updatedUser);
      
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
              
              {previewImage && (
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
                      helperText="This address will be auto-filled during checkout"
                    />
                  </Grid>
                </Grid>
                
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
                  >
                    Save Changes
                  </Button>
                </Box>
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
            Your profile has been updated successfully!
          </Alert>
        </Snackbar>
      </Box>
    </CustomerLayout>
  );
};

export default Settings; 