const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
   // your MySQL password
  database: 'pdfmanagementandcollab'
});

module.exports = db;
