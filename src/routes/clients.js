const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// Client routes
router.get('/', clientController.getAllClients);
router.get('/create', clientController.createClientPage);
router.post('/create', clientController.createClient);
router.get('/edit/:id', clientController.editClientPage);
router.post('/edit/:id', clientController.updateClient);
router.get('/delete/:id', clientController.deleteClient);

module.exports = router;