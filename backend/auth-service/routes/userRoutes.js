const express = require('express');
const { 
  getUsers, 
  getRestaurantAdmins, 
  getDeliveryPersonnel,
  getUserById,
  updateUserPermissions,
  setUserActiveStatus
} = require('../controllers/userController');
const { 
  protect, 
  restrictTo 
} = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

// All these routes require authentication
router.use(protect);

// Admin only routes using role-based authorization (for backward compatibility)
router.get('/', 
  restrictTo('admin'), 
  getUsers
);

// Permission-based routes - now using restrictTo with permissions
router.get('/restaurant-admins', 
  restrictTo(PERMISSIONS.USER_READ), 
  getRestaurantAdmins
);

router.get('/delivery-personnel', 
  restrictTo(PERMISSIONS.USER_READ), 
  getDeliveryPersonnel
);

router.get('/:id', 
  restrictTo(PERMISSIONS.USER_READ), 
  getUserById
);

router.put('/:id/permissions', 
  restrictTo(PERMISSIONS.USER_UPDATE), 
  updateUserPermissions
);

router.put('/:id/activate', 
  restrictTo(PERMISSIONS.USER_UPDATE), 
  setUserActiveStatus
);

module.exports = router; 