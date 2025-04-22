const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

// All admin routes require authentication
router.use(protect);

// Use permission-based access control instead of role-based
router.route('/users')
  .get(restrictTo(PERMISSIONS.USER_READ), adminController.getUsers)
  .post(restrictTo(PERMISSIONS.USER_CREATE), adminController.createUser);

router.route('/users/:id')
  .get(restrictTo(PERMISSIONS.USER_READ), adminController.getUserById)
  .put(restrictTo(PERMISSIONS.USER_UPDATE), adminController.updateUser)
  .delete(restrictTo(PERMISSIONS.USER_DELETE), adminController.deleteUser);

router.put('/users/:id/reset-password', restrictTo(PERMISSIONS.USER_UPDATE), adminController.resetUserPassword);
router.put('/users/:id/set-password', restrictTo(PERMISSIONS.USER_UPDATE), adminController.setUserPassword);

// Add diagnostic endpoint for debugging auth issues
router.get('/users/:id/diagnose', restrictTo(PERMISSIONS.USER_READ), adminController.diagnoseUserAuth);

// Add stats endpoint
router.get('/users/stats', restrictTo(PERMISSIONS.USER_READ), adminController.getUserStats);

module.exports = router; 