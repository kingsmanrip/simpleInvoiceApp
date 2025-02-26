const Invoice = require('../models/invoice');
const Client = require('../models/client');

exports.dashboard = async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Get invoice statistics
    const draftInvoices = await Invoice.findByUserId(userId, { status: 'DRAFT' });
    const pendingInvoices = await Invoice.findByUserId(userId, { status: 'PENDING' });
    const paidInvoices = await Invoice.findByUserId(userId, { status: 'PAID' });
    
    // Calculate total amounts
    const draftTotal = draftInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const pendingTotal = pendingInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const paidTotal = paidInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    
    // Get recent invoices
    const recentInvoices = await Invoice.findByUserId(userId, { limit: 5 });
    
    // Get client count
    const clients = await Client.findByUserId(userId);
    
    res.render('dashboard', {
      title: 'Dashboard',
      stats: {
        draftCount: draftInvoices.length,
        draftTotal,
        pendingCount: pendingInvoices.length,
        pendingTotal,
        paidCount: paidInvoices.length,
        paidTotal,
        clientCount: clients.length
      },
      recentInvoices
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.render('dashboard', {
      title: 'Dashboard',
      stats: {
        draftCount: 0,
        draftTotal: 0,
        pendingCount: 0,
        pendingTotal: 0,
        paidCount: 0,
        paidTotal: 0,
        clientCount: 0
      },
      recentInvoices: [],
      error: 'An error occurred while loading dashboard data'
    });
  }
};