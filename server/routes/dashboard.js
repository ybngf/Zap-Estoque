import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Get dashboard data
router.get('/', async (req, res) => {
  try {
    // Total products
    const [totalProductsResult] = await db.query('SELECT COUNT(*) as count FROM products');
    const totalProducts = totalProductsResult[0].count;
    
    // Low stock products
    const [lowStockResult] = await db.query('SELECT COUNT(*) as count FROM products WHERE stock < min_stock');
    const lowStockProducts = lowStockResult[0].count;
    
    // Recent movements in
    const [movementsInResult] = await db.query(
      'SELECT COUNT(*) as count FROM stock_movements WHERE type = ? ORDER BY date DESC LIMIT 5',
      ['Entrada']
    );
    const recentMovementsIn = movementsInResult[0].count;
    
    // Recent movements out
    const [movementsOutResult] = await db.query(
      'SELECT COUNT(*) as count FROM stock_movements WHERE type = ? ORDER BY date DESC LIMIT 5',
      ['Saída']
    );
    const recentMovementsOut = movementsOutResult[0].count;
    
    // Stock by category
    const [stockByCategory] = await db.query(`
      SELECT c.name, SUM(p.stock) as estoque
      FROM products p
      JOIN categories c ON p.category_id = c.id
      GROUP BY c.id, c.name
    `);
    
    res.json({
      totalProducts,
      lowStockProducts,
      recentMovementsIn,
      recentMovementsOut,
      stockByCategoryData: stockByCategory
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

export default router;
