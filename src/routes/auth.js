const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Public routes
router.get('/register', authController.registerPage);
router.post('/register', authController.register);
router.get('/login', authController.loginPage);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Protected routes
router.get('/profile', requireAuth, authController.profilePage);
router.post('/profile', requireAuth, authController.updateProfile);

module.exports = router;