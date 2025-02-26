const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const morgan = require('morgan');
const dotenv = require('dotenv');
const ejsLayouts = require('express-ejs-layouts');

// Load environment variables
dotenv.config();

// Initialize database
const db = require('./models/database');

// Initialize express app
const app = express();

// Set up middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'invoice-app-secret',
  resave: false,
  saveUninitialized: false
}));

// Set view engine
app.use(ejsLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Routes
const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoices');
const clientRoutes = require('./routes/clients');
const dashboardRoutes = require('./routes/dashboard');

app.use('/auth', authRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/clients', clientRoutes);
app.use('/dashboard', dashboardRoutes);

// Redirect root to dashboard
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Error handling
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});