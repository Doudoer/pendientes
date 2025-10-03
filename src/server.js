require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./models/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/users', require('./routes/users'));

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Initialize database and create default admin user if not exists
const bcrypt = require('bcryptjs');
db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, user) => {
  if (!user) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
      ['admin', hashedPassword, 'admin'],
      (err) => {
        if (err) {
          console.error('Error creating default admin user:', err);
        } else {
          console.log('Default admin user created: username=admin, password=admin123');
        }
      }
    );
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
