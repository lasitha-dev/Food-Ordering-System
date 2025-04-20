const express = require('express');
const router = express.Router();
const { 
  getUserAddresses, 
  getAddressById, 
  createAddress, 
  updateAddress, 
  deleteAddress,
  setDefaultAddress
} = require('../controllers/addressController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Address routes
router.route('/')
  .get(getUserAddresses)
  .post(createAddress);

router.route('/:id')
  .get(getAddressById)
  .put(updateAddress)
  .delete(deleteAddress);

router.route('/:id/default')
  .put(setDefaultAddress);

module.exports = router; 