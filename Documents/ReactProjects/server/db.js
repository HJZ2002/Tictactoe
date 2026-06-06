const path = require('path');
const mysql2 = require('mysql2');

// Load .env from this directory explicitly to avoid issues when the
// server is started from a different working directory.
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const {
  DB_HOST = 'localhost',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'employee_db',
  DB_PORT = 3306,
} = process.env;

if (!DB_USER) {
  console.error('Missing DB_USER environment variable. Check server/.env');
}

const pool = mysql2.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true, // return DECIMAL and NUMERIC columns as numbers
});

module.exports = pool.promise();
