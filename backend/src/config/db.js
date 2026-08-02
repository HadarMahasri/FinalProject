const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '123456',
  database: process.env.DB_NAME || 'eventhub_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database "eventhub_db" successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
  }
}

testConnection();

// Execute standard MySQL queries directly on MySQL database
async function query(sql, params = []) {
  return await pool.query(sql, params);
}

module.exports = {
  query,
  pool
};
