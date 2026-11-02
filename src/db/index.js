// ============================================
// DB Adapter: SQLite or PostgreSQL (auto)
// Selected via DB_TYPE env var
// ============================================
const { DB_TYPE } = process.env;
let adapter;

if ((DB_TYPE || 'sqlite').toLowerCase() === 'postgres') {
  adapter = require('./postgres');
} else {
  adapter = require('./sqlite');
}

module.exports = adapter;
