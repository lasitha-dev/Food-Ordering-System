const express = require('express');
const router = express.Router();
const serviceAccountController = require('../controllers/serviceAccountController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require authentication and ADMIN privileges
router.use(protect);
router.use(restrictTo('ADMIN'));

// Service account management routes
router.route('/')
  .get(serviceAccountController.getServiceAccounts)
  .post(serviceAccountController.createServiceAccount);

router.route('/:id')
  .get(serviceAccountController.getServiceAccount)
  .put(serviceAccountController.updateServiceAccount)
  .delete(serviceAccountController.deleteServiceAccount);

router.post('/:id/regenerate-secret', serviceAccountController.regenerateSecret);

module.exports = router; 