import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Get all stock movements
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM stock_movements ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ error: 'Erro ao buscar movimentações' });
  }
});

// Create stock movement
router.post('/', async (req, res) => {
  try {
    const { productId, type, quantity, reason, date, userId } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO stock_movements (product_id, type, quantity, reason, date, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [productId, type, quantity, reason, date, userId]
    );
    
    // Update product stock based on movement type
    if (type === 'Entrada' || type === 'Ajuste') {
      await db.query(
        'UPDATE products SET stock = stock + ? WHERE id = ?',
        [quantity, productId]
      );
    } else if (type === 'Saída') {
      await db.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [quantity, productId]
      );
    }
    
    const [newMovement] = await db.query('SELECT * FROM stock_movements WHERE id = ?', [result.insertId]);
    res.status(201).json(newMovement[0]);
  } catch (error) {
    console.error('Error creating stock movement:', error);
    res.status(500).json({ error: 'Erro ao criar movimentação' });
  }
});

export default router;
