const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('vendedor', 'dueno', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sales table
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_nombre TEXT NOT NULL,
      cliente_telefono TEXT NOT NULL,
      marca TEXT NOT NULL,
      modelo TEXT NOT NULL,
      ano INTEGER NOT NULL,
      parte TEXT NOT NULL,
      precio REAL NOT NULL,
      fecha DATE NOT NULL,
      estatus TEXT NOT NULL CHECK(estatus IN ('buscando', 'listo', 'entregado', 'reembolsado')) DEFAULT 'buscando',
      vendedor_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vendedor_id) REFERENCES users(id)
    )
  `);

  // Claims table
  db.run(`
    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('cambio', 'reembolso')),
      descripcion TEXT NOT NULL,
      estatus TEXT NOT NULL CHECK(estatus IN ('abierto', 'procesando', 'resuelto', 'rechazado')) DEFAULT 'abierto',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (venta_id) REFERENCES sales(id)
    )
  `);
});

module.exports = db;
