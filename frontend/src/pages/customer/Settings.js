import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import { Edit as EditIcon, Camera as CameraIcon } from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import CustomerLayout from '../../components/layouts/CustomerLayout';

const Settings = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    emailNotifications: true,
    smsNotifications: false,
  });
  
  const [successAlert, setSuccessAlert] = useState(false);
  
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: e.target.type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would normally update the user profile
    // with your API service
    console.log('Updating profile with:', formData);
    setSuccessAlert(true);
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
                  src={currentUser?.profilePic || ""}
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
                >
                  <CameraIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Typography variant="h6">
                {formData.firstName} {formData.lastName}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {formData.email}
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                sx={{ mt: 2 }}
              >
                Change Password
              </Button>
            </Paper>
            
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notification Preferences
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.emailNotifications}
                    onChange={handleChange}
                    name="emailNotifications"
                    color="primary"
                  />
                }
                label="Email Notifications"
                sx={{ width: '100%', mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.smsNotifications}
                    onChange={handleChange}
                    name="smsNotifications"
                    color="primary"
                  />
                }
                label="SMS Notifications"
                sx={{ width: '100%' }}
              />
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
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="button"
                    variant="outlined"
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
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