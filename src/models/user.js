const db = require('./database');
const bcrypt = require('bcrypt');

class User {
  static async create(userData) {
    const { username, email, password, company_name, address, phone } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO users (username, email, password, company_name, address, phone)
                   VALUES (?, ?, ?, ?, ?, ?)`;
                   
      db.run(sql, [username, email, hashedPassword, company_name, address, phone], function(err) {
        if (err) {
          return reject(err);
        }
        resolve({ id: this.lastID, ...userData, password: undefined });
      });
    });
  }
  
  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE username = ?`;
      
      db.get(sql, [username], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }
  
  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE email = ?`;
      
      db.get(sql, [email], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }
  
  static findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT id, username, email, company_name, address, phone, created_at 
                   FROM users WHERE id = ?`;
      
      db.get(sql, [id], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }
  
  static update(id, userData) {
    return new Promise(async (resolve, reject) => {
      const { username, email, company_name, address, phone, password } = userData;
      
      let sql;
      let params;
      
      if (password) {
        // Hash password if it's being updated
        const hashedPassword = await bcrypt.hash(password, 10);
        sql = `UPDATE users 
               SET username = ?, email = ?, company_name = ?, address = ?, phone = ?, password = ?
               WHERE id = ?`;
        params = [username, email, company_name, address, phone, hashedPassword, id];
      } else {
        sql = `UPDATE users 
               SET username = ?, email = ?, company_name = ?, address = ?, phone = ?
               WHERE id = ?`;
        params = [username, email, company_name, address, phone, id];
      }
      
      db.run(sql, params, function(err) {
        if (err) {
          return reject(err);
        }
        
        if (this.changes === 0) {
          return reject(new Error('User not found'));
        }
        
        resolve({ id, ...userData, password: undefined });
      });
    });
  }
  
  static validatePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }
}

module.exports = User;