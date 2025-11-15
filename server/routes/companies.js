import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Get all companies
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM companies ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Erro ao buscar empresas' });
  }
});

// Create company
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO companies (name) VALUES (?)',
      [name]
    );
    
    const [newCompany] = await db.query('SELECT * FROM companies WHERE id = ?', [result.insertId]);
    res.status(201).json(newCompany[0]);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Erro ao criar empresa' });
  }
});

// Delete company
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM companies WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Erro ao deletar empresa' });
  }
});

export default router;
