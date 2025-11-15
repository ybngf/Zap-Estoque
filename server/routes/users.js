import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role, company, avatar FROM users ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, company } = req.body;
    const avatar = `https://picsum.photos/seed/${Date.now()}/100`;
    const userPassword = password || '123456';
    
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, company, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, userPassword, role, company, avatar]
    );
    
    const [newUser] = await db.query(
      'SELECT id, name, email, role, company, avatar FROM users WHERE id = ?', 
      [result.insertId]
    );
    res.status(201).json(newUser[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

export default router;
