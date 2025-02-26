const Client = require('../models/client');

// Get all clients
exports.getAllClients = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const clients = await Client.findByUserId(userId);
    
    res.render('clients/index', { 
      title: 'Clients',
      clients,
      error: null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Get clients error:', err);
    res.render('clients/index', { 
      title: 'Clients',
      clients: [],
      error: 'An error occurred while loading clients',
      success: null
    });
  }
};

// Create client page
exports.createClientPage = (req, res) => {
  res.render('clients/create', { 
    title: 'New Client',
    formData: {},
    error: null
  });
};

// Create client
exports.createClient = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { name, email, phone, address } = req.body;
    
    // Validate input
    if (!name) {
      return res.render('clients/create', { 
        error: 'Client name is required',
        formData: req.body
      });
    }
    
    // Create client
    await Client.create({
      user_id: userId,
      name,
      email: email || '',
      phone: phone || '',
      address: address || ''
    });
    
    res.redirect('/clients?success=Client created successfully');
  } catch (err) {
    console.error('Create client error:', err);
    res.render('clients/create', { 
      error: 'An error occurred while creating client',
      formData: req.body
    });
  }
};

// Edit client page
exports.editClientPage = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const clientId = req.params.id;
    
    const client = await Client.findById(clientId, userId);
    if (!client) {
      return res.redirect('/clients?error=Client not found');
    }
    
    res.render('clients/edit', { 
      title: 'Edit Client',
      client,
      error: null
    });
  } catch (err) {
    console.error('Edit client page error:', err);
    res.redirect('/clients?error=An error occurred while loading client');
  }
};

// Update client
exports.updateClient = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const clientId = req.params.id;
    const { name, email, phone, address } = req.body;
    
    // Validate input
    if (!name) {
      const client = await Client.findById(clientId, userId);
      return res.render('clients/edit', { 
        error: 'Client name is required',
        client: { ...client, ...req.body }
      });
    }
    
    // Update client
    await Client.update(clientId, userId, {
      name,
      email: email || '',
      phone: phone || '',
      address: address || ''
    });
    
    res.redirect('/clients?success=Client updated successfully');
  } catch (err) {
    console.error('Update client error:', err);
    res.redirect(`/clients/edit/${req.params.id}?error=An error occurred while updating client`);
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const clientId = req.params.id;
    
    await Client.delete(clientId, userId);
    
    res.redirect('/clients?success=Client deleted successfully');
  } catch (err) {
    console.error('Delete client error:', err);
    res.redirect('/clients?error=An error occurred while deleting client');
  }
};