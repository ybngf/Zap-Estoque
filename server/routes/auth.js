import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [rows] = await db.query(
      'SELECT id, name, email, role, company, avatar FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

export default router;
