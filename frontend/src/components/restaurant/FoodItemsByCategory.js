import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Button,
  Alert
} from '@mui/material';
import { Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import foodItemApi from '../../services/restaurant-service/api';

const FoodItemsByCategory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedItems, setGroupedItems] = useState({});
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const fetchFoodItems = async () => {
    setLoading(true);
    try {
      const response = await foodItemApi.getAllFoodItems();
      
      if (response && response.data) {
        // Group items by category
        const grouped = {};
        response.data.forEach(item => {
          if (!grouped[item.category]) {
            grouped[item.category] = [];
          }
          grouped[item.category].push(item);
        });
        
        setGroupedItems(grouped);
        setCategories(Object.keys(grouped).sort());
        setError(null);
      } else {
        setError('No food items found');
      }
    } catch (err) {
      console.error('Error fetching food items:', err);
      setError('Failed to load food items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (id) => {
    navigate(`/restaurant/food-items/edit/${id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Menu Items by Category
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/restaurant/food-items/create')}
        >
          Add New Item
        </Button>
      </Box>

      {categories.length === 0 ? (
        <Alert severity="info">
          No food items added yet. Start by adding your first menu item!
        </Alert>
      ) : (
        categories.map(category => (
          <Box key={category} sx={{ mb: 4 }}>
            <Typography variant="h6" component="h3" color="primary" sx={{ mb: 2 }}>
              {category}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              {groupedItems[category].map(item => (
                <Grid item xs={12} sm={6} md={4} key={item._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {item.imageUrl && (
                      <Box
                        sx={{
                          height: 140,
                          background: `url(${item.imageUrl}) no-repeat center center`,
                          backgroundSize: 'cover'
                        }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {item.title}
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditItem(item._id)}
                        >
                          Edit
                        </Button>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
    </Box>
  );
};

export default FoodItemsByCategory; 