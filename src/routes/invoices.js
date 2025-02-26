const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// Invoice routes
router.get('/', invoiceController.getAllInvoices);
router.get('/create', invoiceController.createInvoicePage);
router.post('/create', invoiceController.createInvoice);
router.get('/view/:id', invoiceController.viewInvoice);
router.get('/edit/:id', invoiceController.editInvoicePage);
router.post('/edit/:id', invoiceController.updateInvoice);
router.get('/delete/:id', invoiceController.deleteInvoice);

// Invoice item routes
router.post('/item/:id', invoiceController.addInvoiceItem);
router.post('/item/:id/:itemId', invoiceController.updateInvoiceItem);
router.get('/item/:id/:itemId/delete', invoiceController.deleteInvoiceItem);

// Invoice status update
router.post('/status/:id', invoiceController.updateInvoiceStatus);

// Export invoice as PDF
router.get('/pdf/:id', invoiceController.exportPDF);

module.exports = router;