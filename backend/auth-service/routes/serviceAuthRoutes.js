const express = require('express');
const router = express.Router();
const serviceAuthController = require('../controllers/serviceAuthController');
const { protect, restrictTo } = require('../middleware/auth');

// Public route for service authentication
router.post('/authenticate', serviceAuthController.authenticateService);

// Protected routes for token validation and revocation
router.post('/validate', 
  protect, 
  restrictTo('ADMIN', 'INTERNAL_SERVICE'),
  serviceAuthController.validateServiceToken
);

router.post('/revoke', 
  protect, 
  restrictTo('ADMIN', 'INTERNAL_SERVICE'),
  serviceAuthController.revokeServiceToken
);

module.exports = router; 