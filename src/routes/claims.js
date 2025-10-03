const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all claims
router.get('/', authenticateToken, (req, res) => {
  const query = `
    SELECT c.*, 
           s.cliente_nombre, s.parte, s.precio,
           u.username as vendedor_username
    FROM claims c
    JOIN sales s ON c.venta_id = s.id
    JOIN users u ON s.vendedor_id = u.id
    ORDER BY c.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener reclamos' });
    }
    res.json(rows);
  });
});

// Get single claim
router.get('/:id', authenticateToken, (req, res) => {
  const query = `
    SELECT c.*, 
           s.cliente_nombre, s.cliente_telefono, s.parte, s.precio,
           u.username as vendedor_username
    FROM claims c
    JOIN sales s ON c.venta_id = s.id
    JOIN users u ON s.vendedor_id = u.id
    WHERE c.id = ?
  `;

  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener el reclamo' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Reclamo no encontrado' });
    }
    res.json(row);
  });
});

// Create new claim
router.post('/', authenticateToken, (req, res) => {
  const { venta_id, tipo, descripcion } = req.body;

  if (!venta_id || !tipo || !descripcion) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  if (!['cambio', 'reembolso'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de reclamo inválido' });
  }

  const query = `INSERT INTO claims (venta_id, tipo, descripcion) VALUES (?, ?, ?)`;

  db.run(query, [venta_id, tipo, descripcion], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al crear el reclamo' });
    }
    res.status(201).json({ id: this.lastID, message: 'Reclamo creado exitosamente' });
  });
});

// Update claim status (dueno, admin)
router.patch('/:id/status', authenticateToken, authorizeRoles('dueno', 'admin'), (req, res) => {
  const { estatus } = req.body;

  if (!['abierto', 'procesando', 'resuelto', 'rechazado'].includes(estatus)) {
    return res.status(400).json({ error: 'Estatus inválido' });
  }

  const query = `UPDATE claims SET estatus = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

  db.run(query, [estatus, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar estatus' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reclamo no encontrado' });
    }
    res.json({ message: 'Estatus de reclamo actualizado exitosamente' });
  });
});

// Delete claim (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  db.run('DELETE FROM claims WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar el reclamo' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reclamo no encontrado' });
    }
    res.json({ message: 'Reclamo eliminado exitosamente' });
  });
});

module.exports = router;
