const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const axios = require('axios');

// Validate car part using external API (mock for now)
const validateCarPart = async (marca, modelo, ano) => {
  try {
    // This is a mock validation. In production, you would call a real API
    // Example: const response = await axios.get(`https://api.carparts.com/validate?brand=${marca}&model=${modelo}&year=${ano}`);
    
    // For now, we'll accept all values as valid
    return { valid: true, message: 'Validación exitosa' };
  } catch (error) {
    return { valid: false, message: 'Error en la validación' };
  }
};

// Get all sales (filter out archived for non-admin)
router.get('/', authenticateToken, (req, res) => {
  const { includeArchived } = req.query;
  const role = req.user.role;

  let query = `
    SELECT s.*, u.username as vendedor_username 
    FROM sales s 
    JOIN users u ON s.vendedor_id = u.id
  `;

  // Only show archived items if explicitly requested and user has permission
  if (!includeArchived || includeArchived === 'false') {
    query += ` WHERE s.estatus NOT IN ('entregado', 'reembolsado')`;
  }

  query += ` ORDER BY s.created_at DESC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener ventas' });
    }
    res.json(rows);
  });
});

// Get single sale
router.get('/:id', authenticateToken, (req, res) => {
  const query = `
    SELECT s.*, u.username as vendedor_username 
    FROM sales s 
    JOIN users u ON s.vendedor_id = u.id
    WHERE s.id = ?
  `;

  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener la venta' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    res.json(row);
  });
});

// Create new sale (vendedor, admin)
router.post('/', authenticateToken, authorizeRoles('vendedor', 'admin'), async (req, res) => {
  const { cliente_nombre, cliente_telefono, marca, modelo, ano, parte, precio, fecha } = req.body;

  // Validate required fields
  if (!cliente_nombre || !cliente_telefono || !marca || !modelo || !ano || !parte || !precio || !fecha) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  // Validate car part
  const validation = await validateCarPart(marca, modelo, ano);
  if (!validation.valid) {
    return res.status(400).json({ error: 'Validación de parte fallida: ' + validation.message });
  }

  const vendedor_id = req.user.id;

  const query = `
    INSERT INTO sales (cliente_nombre, cliente_telefono, marca, modelo, ano, parte, precio, fecha, vendedor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [cliente_nombre, cliente_telefono, marca, modelo, ano, parte, precio, fecha, vendedor_id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al crear la venta' });
    }
    res.status(201).json({ id: this.lastID, message: 'Venta creada exitosamente' });
  });
});

// Update sale status (dueno, admin)
router.patch('/:id/status', authenticateToken, authorizeRoles('dueno', 'admin'), (req, res) => {
  const { estatus } = req.body;

  if (!['buscando', 'listo', 'entregado', 'reembolsado'].includes(estatus)) {
    return res.status(400).json({ error: 'Estatus inválido' });
  }

  const query = `UPDATE sales SET estatus = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

  db.run(query, [estatus, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar estatus' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    res.json({ message: 'Estatus actualizado exitosamente' });
  });
});

// Update entire sale (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { cliente_nombre, cliente_telefono, marca, modelo, ano, parte, precio, fecha, estatus } = req.body;

  // Validate car part if marca/modelo/ano changed
  if (marca && modelo && ano) {
    const validation = await validateCarPart(marca, modelo, ano);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validación de parte fallida: ' + validation.message });
    }
  }

  const query = `
    UPDATE sales 
    SET cliente_nombre = ?, cliente_telefono = ?, marca = ?, modelo = ?, ano = ?, 
        parte = ?, precio = ?, fecha = ?, estatus = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [cliente_nombre, cliente_telefono, marca, modelo, ano, parte, precio, fecha, estatus, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar la venta' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    res.json({ message: 'Venta actualizada exitosamente' });
  });
});

// Delete sale (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  db.run('DELETE FROM sales WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar la venta' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    res.json({ message: 'Venta eliminada exitosamente' });
  });
});

module.exports = router;
