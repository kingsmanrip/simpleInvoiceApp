# Simple Invoice App

A lightweight, production-ready invoice application built with Node.js, Express, and SQLite. This app allows users to manage clients, create professional invoices, and track payment status.

## Features

- **User Authentication**
  - Secure registration and login
  - Profile management
  - Password hashing with bcrypt

- **Client Management**
  - Add, edit and delete clients
  - Store client contact information
  - Client-specific invoice history

- **Invoice System**
  - Create professional invoices
  - Add multiple line items with quantity, description, and price
  - Automatic invoice numbering
  - Calculate totals automatically
  - Set status (Draft, Pending, Paid)
  - Add notes to invoices

- **Dashboard**
  - Overview of pending, draft, and paid invoices
  - Quick access to recent invoices
  - Financial summaries and statistics

- **Responsive UI**
  - Mobile-friendly interface
  - Clean and intuitive design
  - Bootstrap-based responsive layout

## Technology Stack

- **Backend**
  - Node.js
  - Express.js
  - SQLite database
  - bcrypt for password hashing

- **Frontend**
  - EJS templating engine
  - Bootstrap 5
  - Font Awesome icons
  - Vanilla JavaScript

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/kingsmanrip/simpleInvoiceApp.git
   cd simpleInvoiceApp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   ```
   cp .env.example .env
   # Edit .env file with your settings
   ```

4. Start the application:
   ```
   npm start
   ```

5. Access the application at:
   ```
   http://localhost:3000
   ```

## Deployment

### Running as a Systemd Service

1. Copy the service file to the systemd directory:
   ```
   sudo cp invoice-app.service /etc/systemd/system/
   ```

2. Edit the service file if needed:
   ```
   sudo nano /etc/systemd/system/invoice-app.service
   ```

3. Enable and start the service:
   ```
   sudo systemctl daemon-reload
   sudo systemctl enable invoice-app.service
   sudo systemctl start invoice-app.service
   ```

4. Check the status:
   ```
   sudo systemctl status invoice-app.service
   ```

## Development

For development with auto-reload:

```
npm run dev
```

## Database

The application uses SQLite for data storage. The database file is stored in the `data` directory.

- No database configuration needed
- Data persists between restarts
- Easy to back up (just copy the database file)

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Input validation
- CSRF protection
- User data isolation

## License

This project is licensed under the ISC License.

---

Created with Claude AI 🤖
