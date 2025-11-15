import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM suppliers ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Erro ao buscar fornecedores' });
  }
});

// Create supplier
router.post('/', async (req, res) => {
  try {
    const { name, contactPerson, email, phone } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO suppliers (name, contact_person, email, phone) VALUES (?, ?, ?, ?)',
      [name, contactPerson, email, phone]
    );
    
    const [newSupplier] = await db.query('SELECT * FROM suppliers WHERE id = ?', [result.insertId]);
    res.status(201).json(newSupplier[0]);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Erro ao criar fornecedor' });
  }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM suppliers WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Erro ao deletar fornecedor' });
  }
});

export default router;
