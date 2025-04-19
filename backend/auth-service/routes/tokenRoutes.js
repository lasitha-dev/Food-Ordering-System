const express = require('express');
const { 
  validateAccessToken,
  introspectToken
} = require('../controllers/tokenController');

const router = express.Router();

// These endpoints are for service-to-service communication
router.post('/validate', validateAccessToken);
router.post('/introspect', introspectToken);

module.exports = router; 