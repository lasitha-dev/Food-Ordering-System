import React, { useState } from 'react';
import { Grid, Container, Box, Typography, Paper, Badge, IconButton, Drawer, useMediaQuery } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useAuth from '../../hooks/useAuth';
import FoodMenu from '../../components/customer/FoodMenu';
import ShoppingCart from '../../components/customer/ShoppingCart';
import { useCart } from '../../context/CartContext';

const CustomerDashboard = () => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [cartOpen, setCartOpen] = useState(false);
  const { cart } = useCart();
  
  // Calculate total items in cart
  const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
  
  // Toggle cart drawer
  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Welcome, {currentUser?.firstName || currentUser?.name || 'Customer'}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Find your favorite meals and order with just a few clicks
            </Typography>
          </Box>
          
          {isMobile && (
            <Badge badgeContent={totalItems} color="primary">
              <IconButton 
                onClick={toggleCart}
                color="primary"
                size="large"
                sx={{ 
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: 2,
                  '&:hover': {
                    backgroundColor: theme.palette.background.paper,
                  }
                }}
              >
                <ShoppingCartIcon />
              </IconButton>
            </Badge>
          )}
        </Box>
        
        <Grid container spacing={4}>
          {/* Food Menu Section */}
          <Grid item xs={12} md={7} lg={8}>
            <FoodMenu />
          </Grid>
          
          {/* Cart Section - Desktop */}
          {!isMobile && (
            <Grid item md={5} lg={4} sx={{ position: 'sticky', top: 20, alignSelf: 'flex-start' }}>
              <ShoppingCart />
            </Grid>
          )}
        </Grid>
      </Box>
      
      {/* Mobile Cart Drawer */}
      <Drawer
        anchor="right"
        open={cartOpen}
        onClose={toggleCart}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: '100%',
            maxWidth: 400,
            boxSizing: 'border-box',
            p: 2
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <ShoppingCart />
        </Box>
      </Drawer>
    </Container>
  );
};

export default CustomerDashboard; 