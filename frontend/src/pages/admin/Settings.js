import React, { useState, useRef } from 'react';
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
  CircularProgress,
  Divider
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';
import useAuth from '../../hooks/useAuth';
import * as authApi from '../../services/auth-service/api';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Validation schema
const validationSchema = Yup.object({
  firstName: Yup
    .string()
    .required('First name is required'),
  lastName: Yup
    .string()
    .required('Last name is required'),
  email: Yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  phone: Yup
    .string()
    .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
});

const Settings = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileImage, setProfileImage] = useState(currentUser?.profileImage || '');
  const fileInputRef = useRef();

  // Form setup
  const formik = useFormik({
    initialValues: {
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      setSuccess('');

      try {
        console.log('Form submission - current profile image:', profileImage);
        
        // Convert base64 image to file if it exists
        let imageFile = null;
        if (profileImage && profileImage.startsWith('data:')) {
          // Only convert if it's a new image (base64 format)
          const res = await fetch(profileImage);
          const blob = await res.blob();
          imageFile = new File([blob], "profile-image.jpg", { type: "image/jpeg" });
        }
        
        // Create form data for multipart/form-data upload
        const formData = new FormData();
        formData.append('firstName', values.firstName);
        formData.append('lastName', values.lastName);
        formData.append('email', values.email);
        formData.append('phone', values.phone);
        
        if (imageFile) {
          formData.append('profileImage', imageFile);
        }
        
        // Call API to update user
        try {
          const response = await authApi.updateCurrentUser(formData);
          
          if (response.success) {
            // Update local user data
            const updatedUser = {
              ...currentUser,
              firstName: values.firstName,
              lastName: values.lastName,
              name: `${values.firstName} ${values.lastName}`,
              email: values.email,
              phone: values.phone,
              profileImage: response.data?.profileImage || profileImage
            };
            
            console.log('Updating current user with:', updatedUser);
            setCurrentUser(updatedUser);
            setSuccess('Profile updated successfully');
            
            // Update localStorage directly
            localStorage.setItem('userProfile', JSON.stringify({
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
              phone: values.phone,
              profileImage: profileImage
            }));
            
            console.log('Saved to localStorage:', {
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
              phone: values.phone,
              profileImage: profileImage
            });
          } else {
            setError(response.message || 'Failed to update profile');
          }
        } catch (apiError) {
          console.error('API update failed:', apiError);
          
          // For demo purposes, update locally
          const updatedUser = {
            ...currentUser,
            firstName: values.firstName,
            lastName: values.lastName,
            name: `${values.firstName} ${values.lastName}`,
            email: values.email,
            phone: values.phone,
            profileImage: profileImage
          };
          
          console.log('Updating current user with (local fallback):', updatedUser);
          setCurrentUser(updatedUser);
          setSuccess('Profile updated successfully (local only)');
          
          // Store in localStorage for persistence
          localStorage.setItem('userProfile', JSON.stringify({
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
            profileImage: profileImage
          }));
          
          console.log('Saved to localStorage (fallback):', {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
            profileImage: profileImage
          });
        }
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('Failed to update profile. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  // Handle profile image upload
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Image selected:', file.name, file.type, file.size);
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Size limit check (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should not exceed 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        console.log('Image loaded as data URL, length:', imageData.length);
        setProfileImage(imageData);
        
        // Preview update for immediate feedback
        // Save to localStorage for persistence across page refreshes
        try {
          const existingProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
          localStorage.setItem('userProfile', JSON.stringify({
            ...existingProfile,
            profileImage: imageData
          }));
          console.log('Saved image to localStorage (temporary)');
        } catch (err) {
          console.error('Failed to save image to localStorage:', err);
        }
      };
      reader.onerror = (e) => {
        console.error('Error reading file:', e);
        setError('Failed to read the image file');
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          My Profile
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Profile Image */}
            <Grid item xs={12} display="flex" justifyContent="center" alignItems="center">
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar
                  src={profileImage}
                  alt={currentUser?.name || "Profile Picture"}
                  sx={{ width: 120, height: 120, mb: 1 }}
                >
                  {!profileImage && (currentUser?.name?.charAt(0) || "A")}
                </Avatar>
                <IconButton 
                  color="primary"
                  sx={{ 
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                  onClick={handleUploadClick}
                >
                  <PhotoCamera />
                </IconButton>
                <input
                  accept="image/*"
                  type="file"
                  hidden
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
              </Box>
            </Grid>
            
            {/* Form Fields */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="firstName"
                name="firstName"
                label="First Name"
                variant="outlined"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="lastName"
                name="lastName"
                label="Last Name"
                variant="outlined"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                variant="outlined"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="phone"
                name="phone"
                label="Phone Number"
                variant="outlined"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={loading}
                >
                  Save Changes
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default Settings; 