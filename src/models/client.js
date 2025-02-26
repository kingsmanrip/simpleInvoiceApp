const db = require('./database');

class Client {
  static create(clientData) {
    const { user_id, name, email, phone, address } = clientData;
    
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO clients (user_id, name, email, phone, address)
                   VALUES (?, ?, ?, ?, ?)`;
                   
      db.run(sql, [user_id, name, email, phone, address], function(err) {
        if (err) {
          return reject(err);
        }
        resolve({ id: this.lastID, ...clientData });
      });
    });
  }
  
  static findById(id, user_id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM clients WHERE id = ? AND user_id = ?`;
      
      db.get(sql, [id, user_id], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }
  
  static findByUserId(user_id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM clients WHERE user_id = ? ORDER BY name`;
      
      db.all(sql, [user_id], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }
  
  static update(id, user_id, clientData) {
    const { name, email, phone, address } = clientData;
    
    return new Promise((resolve, reject) => {
      const sql = `UPDATE clients 
                   SET name = ?, email = ?, phone = ?, address = ?
                   WHERE id = ? AND user_id = ?`;
                   
      db.run(sql, [name, email, phone, address, id, user_id], function(err) {
        if (err) {
          return reject(err);
        }
        
        if (this.changes === 0) {
          return reject(new Error('Client not found'));
        }
        
        resolve({ id, user_id, ...clientData });
      });
    });
  }
  
  static delete(id, user_id) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM clients WHERE id = ? AND user_id = ?`;
      
      db.run(sql, [id, user_id], function(err) {
        if (err) {
          return reject(err);
        }
        
        if (this.changes === 0) {
          return reject(new Error('Client not found'));
        }
        
        resolve(true);
      });
    });
  }
}

module.exports = Client;