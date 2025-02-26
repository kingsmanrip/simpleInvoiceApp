const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF invoice
 * @param {Object} invoice - The invoice object with all data
 * @param {Object} user - The user object with company details
 * @param {String} outputPath - Path to save the PDF (if not provided, returns stream)
 * @returns {Promise} - Promise that resolves with the path to the saved PDF or the PDF stream
 */
function generateInvoicePDF(invoice, user, outputPath = null) {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({ margin: 50 });
      
      // If outputPath is provided, save to file, otherwise return the stream
      let stream;
      if (outputPath) {
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);
      }

      // Add content to the PDF
      generateHeader(doc, user);
      generateCustomerInformation(doc, invoice);
      generateInvoiceTable(doc, invoice);
      generateFooter(doc, invoice);

      // Finalize the PDF
      doc.end();
      
      if (outputPath) {
        stream.on('finish', () => {
          resolve(outputPath);
        });
      } else {
        // Return the document for direct response to client
        resolve(doc);
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate the header section of the invoice
 */
function generateHeader(doc, user) {
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text(user.company_name || user.username, 50, 45)
    .fontSize(10)
    .text(user.company_name || user.username, 200, 50, { align: 'right' })
    .text(user.address || '', 200, 65, { align: 'right' })
    .text(user.email, 200, 80, { align: 'right' })
    .text(user.phone || '', 200, 95, { align: 'right' })
    .moveDown();
}

/**
 * Generate customer information section
 */
function generateCustomerInformation(doc, invoice) {
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('Invoice', 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text('Invoice Number:', 50, customerInformationTop)
    .font('Helvetica-Bold')
    .text(invoice.invoice_number, 150, customerInformationTop)
    .font('Helvetica')
    .text('Invoice Date:', 50, customerInformationTop + 15)
    .text(formatDate(new Date(invoice.issue_date)), 150, customerInformationTop + 15)
    .text('Due Date:', 50, customerInformationTop + 30)
    .text(formatDate(new Date(invoice.due_date)), 150, customerInformationTop + 30)
    .text('Status:', 50, customerInformationTop + 45)
    .font('Helvetica-Bold')
    .text(invoice.status, 150, customerInformationTop + 45)
    .font('Helvetica')

    .font('Helvetica-Bold')
    .text(invoice.client_name, 300, customerInformationTop)
    .font('Helvetica')
    .text(invoice.client_address || '', 300, customerInformationTop + 15)
    .text(invoice.client_email || '', 300, customerInformationTop + 30)
    .text(invoice.client_phone || '', 300, customerInformationTop + 45)
    .moveDown();

  generateHr(doc, 267);
}

/**
 * Generate the invoice table with items
 */
function generateInvoiceTable(doc, invoice) {
  let i;
  const invoiceTableTop = 330;

  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    invoiceTableTop,
    'Item',
    'Description',
    'Quantity',
    'Unit Price',
    'Amount'
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font('Helvetica');

  let position = invoiceTableTop + 30;

  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    generateTableRow(
      doc,
      position,
      i + 1,
      item.description,
      item.quantity,
      formatCurrency(item.unit_price),
      formatCurrency(item.amount)
    );

    position += 20;
  }

  generateHr(doc, position);

  const subtotalPosition = position + 20;
  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    subtotalPosition,
    '',
    '',
    '',
    'Total:',
    formatCurrency(invoice.total_amount)
  );
  doc.font('Helvetica');
}

/**
 * Generate a table row
 */
function generateTableRow(doc, y, item, description, quantity, unitCost, lineTotal) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 100, y)
    .text(quantity, 280, y, { width: 90, align: 'right' })
    .text(unitCost, 370, y, { width: 90, align: 'right' })
    .text(lineTotal, 0, y, { align: 'right' });
}

/**
 * Generate a horizontal line
 */
function generateHr(doc, y) {
  doc
    .strokeColor('#aaaaaa')
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

/**
 * Generate the footer with notes
 */
function generateFooter(doc, invoice) {
  if (invoice.notes) {
    doc.fontSize(10).text(
      'Notes: ' + invoice.notes,
      50,
      780,
      { align: 'left', width: 500 }
    );
  }
}

/**
 * Format a date to a readable string
 */
function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return month + '/' + day + '/' + year;
}

/**
 * Format a number as currency
 */
function formatCurrency(amount) {
  return '$' + Number(amount).toFixed(2);
}

module.exports = {
  generateInvoicePDF
};