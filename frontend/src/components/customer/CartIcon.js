import React from 'react';
import { Badge, IconButton, Tooltip } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { useCart } from '../../context/CartContext';

const CartIcon = ({ onClick }) => {
  const { cart } = useCart();
  
  // Calculate total items in cart
  const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Tooltip title="Shopping Cart">
      <IconButton 
        color="inherit" 
        onClick={onClick}
        sx={{ ml: 1 }}
      >
        <Badge badgeContent={totalItems} color="error">
          <ShoppingCartIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default CartIcon; 