const db = require('./database');

class Invoice {
  static create(invoiceData) {
    const { 
      user_id, 
      client_id, 
      invoice_number, 
      issue_date, 
      due_date, 
      status = 'DRAFT', 
      notes = '' 
    } = invoiceData;
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        const sql = `INSERT INTO invoices (
                      user_id, client_id, invoice_number, issue_date, due_date, status, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                    
        db.run(sql, [user_id, client_id, invoice_number, issue_date, due_date, status, notes], function(err) {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          
          const invoice_id = this.lastID;
          
          db.run('COMMIT', (err) => {
            if (err) {
              return reject(err);
            }
            resolve({ id: invoice_id, ...invoiceData, total_amount: 0 });
          });
        });
      });
    });
  }
  
  static findById(id, user_id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone, c.address as client_address
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        WHERE i.id = ? AND i.user_id = ?
      `;
      
      db.get(sql, [id, user_id], (err, invoice) => {
        if (err) {
          return reject(err);
        }
        
        if (!invoice) {
          return resolve(null);
        }
        
        // Get invoice items
        const itemsSql = `SELECT * FROM invoice_items WHERE invoice_id = ?`;
        
        db.all(itemsSql, [id], (err, items) => {
          if (err) {
            return reject(err);
          }
          
          invoice.items = items || [];
          resolve(invoice);
        });
      });
    });
  }
  
  static findByUserId(user_id, options = {}) {
    return new Promise((resolve, reject) => {
      const { status, client_id, limit = 50, offset = 0 } = options;
      
      let sql = `
        SELECT i.*, c.name as client_name
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        WHERE i.user_id = ?
      `;
      
      const params = [user_id];
      
      if (status) {
        sql += ` AND i.status = ?`;
        params.push(status);
      }
      
      if (client_id) {
        sql += ` AND i.client_id = ?`;
        params.push(client_id);
      }
      
      sql += ` ORDER BY i.issue_date DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      db.all(sql, params, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }
  
  static update(id, user_id, invoiceData) {
    const { 
      client_id, 
      invoice_number, 
      issue_date, 
      due_date, 
      status, 
      notes 
    } = invoiceData;
    
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE invoices 
        SET client_id = ?, invoice_number = ?, issue_date = ?, 
            due_date = ?, status = ?, notes = ?
        WHERE id = ? AND user_id = ?
      `;
      
      db.run(sql, [client_id, invoice_number, issue_date, due_date, status, notes, id, user_id], function(err) {
        if (err) {
          return reject(err);
        }
        
        if (this.changes === 0) {
          return reject(new Error('Invoice not found'));
        }
        
        resolve({ id, user_id, ...invoiceData });
      });
    });
  }
  
  static delete(id, user_id) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // First delete invoice items
        db.run(`DELETE FROM invoice_items WHERE invoice_id = ?`, [id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          
          // Then delete the invoice
          db.run(`DELETE FROM invoices WHERE id = ? AND user_id = ?`, [id, user_id], function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            if (this.changes === 0) {
              db.run('ROLLBACK');
              return reject(new Error('Invoice not found'));
            }
            
            db.run('COMMIT', (err) => {
              if (err) {
                return reject(err);
              }
              resolve(true);
            });
          });
        });
      });
    });
  }
  
  static addInvoiceItem(invoice_id, itemData) {
    const { description, quantity, unit_price } = itemData;
    const amount = quantity * unit_price;
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Insert the item
        const insertSql = `
          INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        db.run(insertSql, [invoice_id, description, quantity, unit_price, amount], function(err) {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          
          const item_id = this.lastID;
          
          // Update the invoice total
          const updateSql = `
            UPDATE invoices 
            SET total_amount = (
              SELECT SUM(amount) FROM invoice_items WHERE invoice_id = ?
            )
            WHERE id = ?
          `;
          
          db.run(updateSql, [invoice_id, invoice_id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            db.run('COMMIT', (err) => {
              if (err) {
                return reject(err);
              }
              resolve({ id: item_id, invoice_id, description, quantity, unit_price, amount });
            });
          });
        });
      });
    });
  }
  
  static updateInvoiceItem(item_id, invoice_id, itemData) {
    const { description, quantity, unit_price } = itemData;
    const amount = quantity * unit_price;
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Update the item
        const updateItemSql = `
          UPDATE invoice_items
          SET description = ?, quantity = ?, unit_price = ?, amount = ?
          WHERE id = ? AND invoice_id = ?
        `;
        
        db.run(updateItemSql, [description, quantity, unit_price, amount, item_id, invoice_id], function(err) {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          
          if (this.changes === 0) {
            db.run('ROLLBACK');
            return reject(new Error('Invoice item not found'));
          }
          
          // Update the invoice total
          const updateInvoiceSql = `
            UPDATE invoices 
            SET total_amount = (
              SELECT SUM(amount) FROM invoice_items WHERE invoice_id = ?
            )
            WHERE id = ?
          `;
          
          db.run(updateInvoiceSql, [invoice_id, invoice_id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            db.run('COMMIT', (err) => {
              if (err) {
                return reject(err);
              }
              resolve({ id: item_id, invoice_id, description, quantity, unit_price, amount });
            });
          });
        });
      });
    });
  }
  
  static deleteInvoiceItem(item_id, invoice_id) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Delete the item
        db.run(`DELETE FROM invoice_items WHERE id = ? AND invoice_id = ?`, [item_id, invoice_id], function(err) {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          
          if (this.changes === 0) {
            db.run('ROLLBACK');
            return reject(new Error('Invoice item not found'));
          }
          
          // Update the invoice total
          const updateSql = `
            UPDATE invoices 
            SET total_amount = (
              SELECT COALESCE(SUM(amount), 0) FROM invoice_items WHERE invoice_id = ?
            )
            WHERE id = ?
          `;
          
          db.run(updateSql, [invoice_id, invoice_id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            db.run('COMMIT', (err) => {
              if (err) {
                return reject(err);
              }
              resolve(true);
            });
          });
        });
      });
    });
  }
  
  static getNextInvoiceNumber(user_id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT MAX(CAST(REPLACE(invoice_number, 'INV-', '') AS INTEGER)) as max_num
        FROM invoices
        WHERE user_id = ? AND invoice_number LIKE 'INV-%'
      `;
      
      db.get(sql, [user_id], (err, row) => {
        if (err) {
          return reject(err);
        }
        
        let nextNum = 1;
        if (row && row.max_num) {
          nextNum = row.max_num + 1;
        }
        
        // Format with leading zeros for a 5-digit number
        const nextInvoiceNumber = `INV-${String(nextNum).padStart(5, '0')}`;
        resolve(nextInvoiceNumber);
      });
    });
  }
}

module.exports = Invoice;