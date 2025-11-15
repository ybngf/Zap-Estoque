import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const { name, sku, categoryId, supplierId, price, stock, minStock } = req.body;
    const imageUrl = `https://picsum.photos/seed/${Date.now()}/400`;
    
    const [result] = await db.query(
      'INSERT INTO products (name, sku, category_id, supplier_id, price, stock, min_stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, sku, categoryId, supplierId, price, stock, minStock, imageUrl]
    );
    
    const [newProduct] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(newProduct[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, categoryId, supplierId, price, stock, minStock } = req.body;
    
    await db.query(
      'UPDATE products SET name = ?, sku = ?, category_id = ?, supplier_id = ?, price = ?, stock = ?, min_stock = ? WHERE id = ?',
      [name, sku, categoryId, supplierId, price, stock, minStock, id]
    );
    
    const [updatedProduct] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json(updatedProduct[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

export default router;
