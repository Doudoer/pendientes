const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../models/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), (req, res) => {
  db.all('SELECT id, username, role, created_at FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
    res.json(rows);
  });
});

// Create new user (admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  if (!['vendedor', 'dueno', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
    [username, hashedPassword, role], 
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'El usuario ya existe' });
        }
        return res.status(500).json({ error: 'Error al crear usuario' });
      }
      res.status(201).json({ id: this.lastID, message: 'Usuario creado exitosamente' });
    }
  );
});

// Update user (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !role) {
    return res.status(400).json({ error: 'Username y rol son requeridos' });
  }

  if (!['vendedor', 'dueno', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  let query, params;
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    query = 'UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?';
    params = [username, hashedPassword, role, req.params.id];
  } else {
    query = 'UPDATE users SET username = ?, role = ? WHERE id = ?';
    params = [username, role, req.params.id];
  }

  db.run(query, params, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'El nombre de usuario ya existe' });
      }
      return res.status(500).json({ error: 'Error al actualizar usuario' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario actualizado exitosamente' });
  });
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar usuario' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  });
});

module.exports = router;
