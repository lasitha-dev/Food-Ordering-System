import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Grid, 
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, BugReport as DebugIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import foodItemApi from '../../services/restaurant-service/api';
import ServiceStatusNotification from './ServiceStatusNotification';
import { testTokenVerification, testAuthHeaders } from '../../utils/tokenTester';

const FoodItemList = () => {
  const navigate = useNavigate();
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch food items on component mount
  useEffect(() => {
    fetchFoodItems();
  }, []);

  // Function to fetch all food items
  const fetchFoodItems = async () => {
    setLoading(true);
    try {
      console.log('Fetching food items...');
      
      // Debug auth information
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo');
      console.log('Token in localStorage:', token ? 'Found' : 'Not found');
      console.log('UserInfo in localStorage:', userInfo ? 'Found' : 'Not found');
      
      if (userInfo) {
        try {
          const parsedUserInfo = JSON.parse(userInfo);
          console.log('Parsed userInfo:', parsedUserInfo);
        } catch (e) {
          console.error('Error parsing userInfo:', e);
        }
      }
      
      // Skip direct service check and use the API through the proxy instead
      // The proxy in setupProxy.js will route the request correctly
      
      // If service is running, try to get food items
      const response = await foodItemApi.getAllFoodItems();
      console.log('Food items response:', response);
      
      // Check if the response has the expected structure
      if (response && response.data) {
        setFoodItems(response.data);
        setError(null);
      } else {
        console.error('Unexpected response format:', response);
        setError('Received an unexpected response format from the server.');
      }
    } catch (err) {
      console.error('Error fetching food items:', err);
      let errorMessage = 'Failed to load food items. Please try again.';
      
      // Add more detailed error information
      if (err.response) {
        // The request was made and the server responded with a status code
        console.error('Server responded with error:', err.response.data);
        errorMessage = `Server error: ${err.response.status} - ${err.response.data.message || 'Unknown error'}`;
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        errorMessage = 'No response from server. Please check if the backend service is running.';
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', err.message);
        errorMessage = `Request error: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new food item
  const handleAddFoodItem = () => {
    navigate('/restaurant/food-items/create');
  };

  // Handle editing a food item
  const handleEditFoodItem = (id) => {
    navigate(`/restaurant/food-items/edit/${id}`);
  };

  // Handle delete confirmation dialog
  const openDeleteDialog = (item) => {
    setItemToDelete(item);
    setDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialog(false);
    setItemToDelete(null);
  };

  // Handle deleting a food item
  const handleDeleteFoodItem = async () => {
    if (!itemToDelete) return;
    
    try {
      await foodItemApi.deleteFoodItem(itemToDelete._id);
      setFoodItems(foodItems.filter(item => item._id !== itemToDelete._id));
      setSnackbar({
        open: true,
        message: 'Food item deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting food item:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete food item. Please try again.',
        severity: 'error'
      });
    } finally {
      closeDeleteDialog();
    }
  };

  // Handle closing the snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Check if the error is a backend service issue
  const isServiceDownError = (error) => {
    return error && (
      error.includes('service appears to be down') || 
      error.includes('No response from server') ||
      error.includes('Failed to fetch')
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        {isServiceDownError(error) ? (
          <ServiceStatusNotification serviceName="Restaurant" port="3002" error={error} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
            <Typography variant="h6" color="error" gutterBottom>
              {error}
            </Typography>
            <Button variant="contained" onClick={fetchFoodItems} sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/restaurant')}
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            Food Items
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<DebugIcon />}
            onClick={async () => {
              try {
                await testTokenVerification();
                await testAuthHeaders();
                setSnackbar({
                  open: true,
                  message: 'Debug tests completed. Check console for results.',
                  severity: 'info'
                });
              } catch (err) {
                console.error('Debug tests failed:', err);
                setSnackbar({
                  open: true,
                  message: 'Debug tests failed. Check console for details.',
                  severity: 'error'
                });
              }
            }}
          >
            Debug Auth
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddFoodItem}
          >
            Add New Food Item
          </Button>
        </Box>
      </Box>

      {foodItems.length === 0 ? (
        <Card sx={{ mt: 4, p: 3, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="h6" color="textSecondary">
              No food items found. Start by adding a new food item.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddFoodItem}
              sx={{ mt: 2 }}
            >
              Add New Food Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {foodItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {item.imageUrl && (
                  <Box
                    sx={{
                      height: 180,
                      background: `url(${item.imageUrl}) no-repeat center center`,
                      backgroundSize: 'cover'
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {item.title}
                  </Typography>
                  <Chip 
                    label={item.category} 
                    size="small" 
                    color="secondary" 
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <IconButton 
                    color="primary" 
                    onClick={() => handleEditFoodItem(item._id)}
                    aria-label="edit food item"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    color="error" 
                    onClick={() => openDeleteDialog(item)}
                    aria-label="delete food item"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteFoodItem} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FoodItemList; 