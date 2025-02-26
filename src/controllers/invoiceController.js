const Invoice = require('../models/invoice');
const Client = require('../models/client');
const User = require('../models/user');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const path = require('path');

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { status, client_id } = req.query;
    
    const invoices = await Invoice.findByUserId(userId, { status, client_id });
    const clients = await Client.findByUserId(userId);
    
    res.render('invoices/index', { 
      title: 'Invoices',
      invoices,
      clients,
      filters: { status, client_id },
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Get invoices error:', err);
    res.render('invoices/index', { 
      title: 'Invoices',
      invoices: [],
      clients: [],
      filters: {},
      error: 'An error occurred while loading invoices',
      success: null
    });
  }
};

// Create invoice page
exports.createInvoicePage = async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Get all clients
    const clients = await Client.findByUserId(userId);
    if (clients.length === 0) {
      return res.redirect('/clients/create?message=Please create a client first');
    }
    
    // Get next invoice number
    const invoiceNumber = await Invoice.getNextInvoiceNumber(userId);
    
    // Set default dates
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30); // Default due date: 30 days from today
    
    const issueDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const formattedDueDate = dueDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    res.render('invoices/create', { 
      title: 'New Invoice',
      clients,
      formData: {
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        due_date: formattedDueDate,
        client_id: req.query.client_id || '',
        status: 'DRAFT'
      },
      items: [],
      error: null
    });
  } catch (err) {
    console.error('Create invoice page error:', err);
    res.redirect('/invoices?error=An error occurred while loading the create invoice page');
  }
};

// Create invoice
exports.createInvoice = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { 
      client_id, 
      invoice_number, 
      issue_date, 
      due_date, 
      status,
      notes,
      'item-description': descriptions,
      'item-quantity': quantities,
      'item-unit-price': unitPrices
    } = req.body;
    
    // Validate input
    if (!client_id || !invoice_number || !issue_date || !due_date) {
      const clients = await Client.findByUserId(userId);
      return res.render('invoices/create', { 
        error: 'Client, invoice number, issue date, and due date are required',
        clients,
        formData: req.body,
        items: []
      });
    }
    
    // Create invoice
    const invoice = await Invoice.create({
      user_id: userId,
      client_id,
      invoice_number,
      issue_date,
      due_date,
      status: status || 'DRAFT',
      notes: notes || ''
    });
    
    // Add invoice items
    let itemsAdded = 0;
    
    if (descriptions) {
      const descArray = Array.isArray(descriptions) ? descriptions : [descriptions];
      const quantityArray = Array.isArray(quantities) ? quantities : [quantities];
      const unitPriceArray = Array.isArray(unitPrices) ? unitPrices : [unitPrices];
      
      for (let i = 0; i < descArray.length; i++) {
        if (descArray[i] && quantityArray[i] && unitPriceArray[i]) {
          await Invoice.addInvoiceItem(invoice.id, {
            description: descArray[i],
            quantity: parseFloat(quantityArray[i]),
            unit_price: parseFloat(unitPriceArray[i])
          });
          itemsAdded++;
        }
      }
    }
    
    res.redirect(`/invoices/view/${invoice.id}?success=Invoice created with ${itemsAdded} items`);
  } catch (err) {
    console.error('Create invoice error:', err);
    res.redirect('/invoices?error=An error occurred while creating invoice');
  }
};

// View invoice
exports.viewInvoice = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const invoiceId = req.params.id;
    
    const invoice = await Invoice.findById(invoiceId, userId);
    if (!invoice) {
      return res.redirect('/invoices?error=Invoice not found');
    }
    
    res.render('invoices/view', { 
      title: `Invoice ${invoice.invoice_number}`,
      invoice,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('View invoice error:', err);
    res.redirect('/invoices?error=An error occurred while loading invoice');
  }
};

// Edit invoice page
exports.editInvoicePage = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const invoiceId = req.params.id;
    
    const invoice = await Invoice.findById(invoiceId, userId);
    if (!invoice) {
      return res.redirect('/invoices?error=Invoice not found');
    }
    
    // Get all clients
    const clients = await Client.findByUserId(userId);
    
    res.render('invoices/edit', { 
      title: 'Edit Invoice',
      invoice,
      clients,
      error: null
    });
  } catch (err) {
    console.error('Edit invoice page error:', err);
    res.redirect('/invoices?error=An error occurred while loading invoice');
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const invoiceId = req.params.id;
    const { 
      client_id, 
      invoice_number, 
      issue_date, 
      due_date, 
      status,
      notes
    } = req.body;
    
    // Validate input
    if (!client_id || !invoice_number || !issue_date || !due_date) {
      return res.redirect(`/invoices/edit/${invoiceId}?error=Client, invoice number, issue date, and due date are required`);
    }
    
    // Update invoice
    await Invoice.update(invoiceId, userId, {
      client_id,
      invoice_number,
      issue_date,
      due_date,
      status: status || 'DRAFT',
      notes: notes || ''
    });
    
    res.redirect(`/invoices/view/${invoiceId}?success=Invoice updated successfully`);
  } catch (err) {
    console.error('Update invoice error:', err);
    res.redirect(`/invoices/edit/${req.params.id}?error=An error occurred while updating invoice`);
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const invoiceId = req.params.id;
    
    await Invoice.delete(invoiceId, userId);
    
    res.redirect('/invoices?success=Invoice deleted successfully');
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.redirect('/invoices?error=An error occurred while deleting invoice');
  }
};

// Add invoice item
exports.addInvoiceItem = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const invoiceId = req.params.id;
    const { description, quantity, unit_price } = req.body;
    
    // Validate input
    if (!description || !quantity || !unit_price) {
      return res.redirect(`/invoices/view/${invoiceId}?error=Description, quantity, and unit price are required for new item`);
    }
    
    // Verify invoice belongs to user
    const invoice = await Invoice.findById(invoiceId, userId);
    if (!invoice) {
      return res.redirect('/invoices?error=Invoice not found');
    }
    
    // Add item
    await Invoice.addInvoiceItem(invoiceId, {
      description,
      quantity: parseFloat(quantity),
      unit_price: parseFloat(unit_price)
    });
    
    res.redirect(`/invoices/view/${invoiceId}?success=Item added successfully`);
  } catch (err) {
    console.error('Add invoice item error:', err);
    res.redirect(`/invoices/view/${req.params.id}?error=An error occurred while adding item`);
  }
};

// Update invoice item
exports.updateInvoiceItem = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const invoiceId = req.params.id;
    const itemId = req.params.itemId;
    const { description, quantity, unit_price } = req.body;
    
    // Validate input
    if (!description || !quantity || !unit_price) {
      return res.redirect(`/invoices/view/${invoiceId}?error=Description, quantity, and unit price are required`);
    }
    
    // Verify invoice belongs to user
    const invoice = await Invoice.findById(invoiceId, userId);
    if (!invoice) {
      return res.redirect('/invoices?error=Invoice not found');
    }
    
    // Update item
    await Invoice.updateInvoiceItem(itemId, invoiceId, {
      description,
      quantity: parseFloat(quantity),
      unit_price: parseFloat(unit_price)
    });
    
    res.redirect(`/invoices/view/${invoiceId}?success=Item updated successfully`);
  } catch (err) {
    console.error('Update invoice item error:', err);
    res.redirect(`/invoices/view/${req.params.id}?error=An error occurred while updating item`);
  }
};

// Delete invoice item
exports.deleteInvoiceItem = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const invoiceId = req.params.id;
    const itemId = req.params.itemId;
    
    // Verify invoice belongs to user
    const invoice = await Invoice.findById(invoiceId, userId);
    if (!invoice) {
      return res.redirect('/invoices?error=Invoice not found');
    }
    
    // Delete item
    await Invoice.deleteInvoiceItem(itemId, invoiceId);
    
    res.redirect(`/invoices/view/${invoiceId}?success=Item deleted successfully`);
  } catch (err) {
    console.error('Delete invoice item error:', err);
    res.redirect(`/invoices/view/${req.params.id}?error=An error occurred while deleting item`);
  }
};

// Update invoice status
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const invoiceId = req.params.id;
    const { status } = req.body;
    
    // Validate input
    if (!status) {
      return res.redirect(`/invoices/view/${invoiceId}?error=Status is required`);
    }
    
    // Get current invoice
    const invoice = await Invoice.findById(invoiceId, userId);
    if (!invoice) {
      return res.redirect('/invoices?error=Invoice not found');
    }
    
    // Update status
    await Invoice.update(invoiceId, userId, {
      client_id: invoice.client_id,
      invoice_number: invoice.invoice_number,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      status,
      notes: invoice.notes
    });
    
    res.redirect(`/invoices/view/${invoiceId}?success=Invoice status updated to ${status}`);
  } catch (err) {
    console.error('Update invoice status error:', err);
    res.redirect(`/invoices/view/${req.params.id}?error=An error occurred while updating status`);
  }
};

// Export invoice as PDF
exports.exportPDF = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const invoiceId = req.params.id;
    
    // Get invoice data
    const invoice = await Invoice.findById(invoiceId, userId);
    if (!invoice) {
      return res.status(404).send('Invoice not found');
    }
    
    // Get user data for company information
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }
    
    // Generate PDF directly to response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoice_number}.pdf"`);
    
    // Generate and stream the PDF directly to the response
    const doc = await generateInvoicePDF(invoice, user);
    doc.pipe(res);
    
  } catch (err) {
    console.error('Export PDF error:', err);
    res.status(500).send('An error occurred while generating the PDF');
  }
};