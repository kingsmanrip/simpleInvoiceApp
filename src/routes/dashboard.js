const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// Dashboard route
router.get('/', dashboardController.dashboard);

module.exports = router;