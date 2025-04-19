import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  FormHelperText
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import foodItemApi from '../../services/restaurant-service/api';

// Food categories
const foodCategories = [
  'Appetizer',
  'Soup',
  'Salad',
  'Main Course',
  'Seafood',
  'Vegetarian',
  'Dessert',
  'Beverage',
  'Breakfast',
  'Fast Food',
  'Healthy',
  'Italian',
  'Mexican',
  'Asian',
  'Indian',
  'Other'
];

// Validation schema
const foodItemSchema = Yup.object().shape({
  title: Yup.string()
    .required('Title is required')
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: Yup.string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be at most 500 characters'),
  category: Yup.string()
    .required('Category is required')
    .oneOf(foodCategories, 'Invalid category selected'),
  price: Yup.number()
    .required('Price is required')
    .positive('Price must be positive')
    .typeError('Price must be a number'),
  imageUrl: Yup.string()
    .url('Must be a valid URL')
    .nullable()
});

const FoodItemForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Initialize Formik
  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      category: '',
      price: '',
      imageUrl: ''
    },
    validationSchema: foodItemSchema,
    onSubmit: async (values) => {
      handleSubmit(values);
    }
  });

  // Fetch food item if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchFoodItem();
    }
  }, [id]);

  // Fetch food item data for editing
  const fetchFoodItem = async () => {
    setInitializing(true);
    try {
      console.log('Fetching food item with ID:', id);
      const response = await foodItemApi.getFoodItemById(id);
      console.log('Food item data received:', response);
      
      if (response && response.data) {
        // Set form values
        formik.setValues({
          title: response.data.title || '',
          description: response.data.description || '',
          category: response.data.category || '',
          price: response.data.price || '',
          imageUrl: response.data.imageUrl || ''
        });
        
        setError(null);
      } else {
        console.error('Unexpected response format:', response);
        setError('Received an unexpected response format from the server.');
      }
    } catch (err) {
      console.error('Error fetching food item:', err);
      if (err.response) {
        setError(`Error: ${err.response.status} - ${err.response.data.message || 'Unknown error'}`);
      } else {
        setError('Failed to load food item data. Please try again.');
      }
    } finally {
      setInitializing(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (isEditMode) {
        // Update existing food item
        await foodItemApi.updateFoodItem(id, values);
        setSnackbar({
          open: true,
          message: 'Food item updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new food item
        await foodItemApi.createFoodItem(values);
        setSnackbar({
          open: true,
          message: 'Food item created successfully!',
          severity: 'success'
        });
        formik.resetForm();
      }

      // Redirect after a short delay to show the success message
      setTimeout(() => {
        navigate('/restaurant/food-items');
      }, 1500);
    } catch (err) {
      console.error('Error saving food item:', err);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditMode ? 'update' : 'create'} food item. Please try again.`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle canceling the form
  const handleCancel = () => {
    navigate('/restaurant/food-items');
  };

  // Handle closing the snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (initializing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && isEditMode) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={fetchFoodItem} sx={{ mt: 2 }}>
          Retry
        </Button>
        <Button variant="outlined" onClick={handleCancel} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Food Item' : 'Add New Food Item'}
        </Typography>

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="title"
                name="title"
                label="Food Item Title"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
                disabled={loading}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                id="category"
                name="category"
                label="Category"
                value={formik.values.category}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.category && Boolean(formik.errors.category)}
                helperText={formik.touched.category && formik.errors.category}
                disabled={loading}
                required
              >
                {foodCategories.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
                multiline
                rows={4}
                disabled={loading}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="price"
                name="price"
                label="Price ($)"
                type="number"
                value={formik.values.price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.price && Boolean(formik.errors.price)}
                helperText={formik.touched.price && formik.errors.price}
                disabled={loading}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="imageUrl"
                name="imageUrl"
                label="Image URL"
                placeholder="https://example.com/image.jpg"
                value={formik.values.imageUrl}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.imageUrl && Boolean(formik.errors.imageUrl)}
                helperText={formik.touched.imageUrl && formik.errors.imageUrl}
                disabled={loading}
              />
              <FormHelperText>
                Enter a URL for the food item image (optional)
              </FormHelperText>
            </Grid>

            {formik.values.imageUrl && (
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Image Preview:
                  </Typography>
                  <Box
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      overflow: 'hidden',
                      borderRadius: 1,
                      border: '1px solid #ccc',
                    }}
                  >
                    <img
                      src={formik.values.imageUrl}
                      alt="Food item preview"
                      style={{ width: '100%', height: 'auto', maxHeight: '200px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=Invalid+Image+URL';
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            )}

            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !formik.isValid}
              >
                {loading ? <CircularProgress size={24} /> : isEditMode ? 'Update Food Item' : 'Create Food Item'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FoodItemForm; 