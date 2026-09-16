require('dotenv').config();
const pool = require('./db');
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error getting connection:', err);
    return;
  }
  console.log('Connection successful');
  connection.release();
});
