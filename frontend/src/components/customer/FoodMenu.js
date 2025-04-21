import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Skeleton,
  Fab,
  Snackbar,
  Alert
} from '@mui/material';
import { Add, Remove, Search as SearchIcon, ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import foodItemApi from '../../services/restaurant-service/api';
import { useCart } from '../../context/CartContext';

// Styled components
const MenuCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const MenuImage = styled(CardMedia)(({ theme }) => ({
  paddingTop: '65%', // Taller aspect ratio
  position: 'relative',
}));

const CategoryBadge = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: 12,
  right: 12,
  fontWeight: 'bold',
}));

const MenuItemTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1.2rem',
  marginBottom: theme.spacing(1.5),
  marginTop: theme.spacing(1),
}));

const MenuItemPrice = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
  fontSize: '1.3rem',
}));

const QuantityControl = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(1),
}));

const QuantityButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5),
}));

const QuantityInput = styled(TextField)(({ theme }) => ({
  width: 45,
  margin: 0,
  '& input': {
    textAlign: 'center',
    padding: theme.spacing(0.5),
    paddingLeft: theme.spacing(0),
    paddingRight: theme.spacing(0),
  },
}));

// Main FoodMenu component
const FoodMenu = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState({});
  const [categories, setCategories] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [cartButtonLoading, setCartButtonLoading] = useState({});
  
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Fetch food items on component mount
  useEffect(() => {
    fetchFoodItems();
  }, []);

  // Function to fetch all food items
  const fetchFoodItems = async () => {
    setLoading(true);
    try {
      console.log('Fetching food items for customer...');
      const response = await foodItemApi.getPublicFoodItems();
      
      if (response && response.data) {
        setFoodItems(response.data);
        
        // Initialize quantities
        const initialQuantities = {};
        response.data.forEach(item => {
          initialQuantities[item._id] = 1;
        });
        setQuantities(initialQuantities);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(response.data.map(item => item.category))];
        setCategories(uniqueCategories);
        
        console.log(`Loaded ${response.data.length} food items with ${uniqueCategories.length} categories`);
      }
    } catch (err) {
      console.error('Error fetching food items:', err);
      setError('Failed to load menu items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter food items by category and search term
  const filteredItems = foodItems.filter(item => {
    const matchesCategory = category === 'all' || item.category === category;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Handle quantity change
  const handleQuantityChange = (id, value) => {
    // Ensure quantity is at least 1
    const newValue = Math.max(1, value);
    setQuantities({
      ...quantities,
      [id]: newValue
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle add to cart
  const handleAddToCart = async (item) => {
    try {
      // Set loading state for this specific button
      setCartButtonLoading(prev => ({ ...prev, [item._id]: true }));
      
      const quantity = quantities[item._id] || 1;
      
      // Create item object with fields required by the backend API
      const itemToAdd = {
        _id: item._id,
        title: item.title,
        price: Number(item.price), // Ensure price is a number
        quantity: Number(quantity), // Ensure quantity is a number
        image: item.imageUrl || '',
        categoryId: item.category || ''
      };
      
      console.log('Adding to cart, formatted item:', itemToAdd);
      
      // Check login status before proceeding
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not logged in. Please log in to add items to your cart.');
      }
      
      // Add to cart using API
      await addToCart(itemToAdd);
      
      // Show success message
      setSnackbar({
        open: true,
        message: `${item.title} added to cart!`,
        severity: 'success'
      });
      
      // Reset quantity after adding to cart
      setQuantities({
        ...quantities,
        [item._id]: 1
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      
      // Show appropriate error message
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add to cart';
      setSnackbar({
        open: true,
        message: `Error: ${errorMsg}`,
        severity: 'error'
      });
    } finally {
      // Clear loading state
      setCartButtonLoading(prev => ({ ...prev, [item._id]: false }));
    }
  };

  // Add function to handle checkout navigation
  const handleGoToCheckout = () => {
    navigate('/customer/checkout');
  };

  // Show loading skeleton while data is being fetched
  if (loading) {
    return (
      <Container>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Card>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton variant="text" height={30} width="80%" />
                  <Skeleton variant="text" height={20} width="60%" />
                  <Skeleton variant="text" height={20} width="40%" />
                </CardContent>
                <CardActions>
                  <Skeleton variant="rectangular" height={36} width="100%" />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  // Show error message if data fetch failed
  if (error) {
    return (
      <Container>
        <Paper sx={{ p: 3, textAlign: 'center', mt: 3 }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" onClick={fetchFoodItems} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container>
      {/* Menu header and filtering */}
      <Box sx={{ mb: 4, mt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Our Menu
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Checkout button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGoToCheckout}
            startIcon={<ShoppingCartIcon />}
          >
            Go to Checkout
          </Button>
        </Box>
      </Box>
      
      {/* Food items grid */}
      <Grid container spacing={3}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <MenuCard>
                <MenuImage
                  image={item.imageUrl || 'https://via.placeholder.com/300x200?text=Food+Image'}
                  title={item.title}
                >
                  <CategoryBadge
                    label={item.category}
                    color="primary"
                  />
                </MenuImage>
                <CardContent>
                  <MenuItemTitle variant="h6">
                    {item.title}
                  </MenuItemTitle>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.description}
                  </Typography>
                  <MenuItemPrice>${item.price.toFixed(2)}</MenuItemPrice>
                  
                  <QuantityControl>
                    <QuantityButton
                      onClick={() => handleQuantityChange(item._id, quantities[item._id] - 1)}
                      disabled={quantities[item._id] <= 1}
                    >
                      <Remove fontSize="small" />
                    </QuantityButton>
                    <QuantityInput
                      size="small"
                      value={quantities[item._id] || 1}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          handleQuantityChange(item._id, value);
                        }
                      }}
                      inputProps={{ min: 1, max: 99 }}
                    />
                    <QuantityButton
                      onClick={() => handleQuantityChange(item._id, quantities[item._id] + 1)}
                    >
                      <Add fontSize="small" />
                    </QuantityButton>
                  </QuantityControl>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleAddToCart(item)}
                    startIcon={<ShoppingCartIcon />}
                    disabled={cartButtonLoading[item._id]}
                  >
                    {cartButtonLoading[item._id] ? <CircularProgress size={24} /> : "Add to Cart"}
                  </Button>
                </CardActions>
              </MenuCard>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No items found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Try adjusting your search or filter criteria.
              </Typography>
              {category !== 'all' && (
                <Button
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={() => setCategory('all')}
                >
                  Show All Categories
                </Button>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
      
      {/* Floating checkout button for mobile */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: { xs: 'block', md: 'none' } }}>
        <Fab
          color="primary"
          aria-label="checkout"
          onClick={handleGoToCheckout}
        >
          <ShoppingCartIcon />
        </Fab>
      </Box>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FoodMenu; 