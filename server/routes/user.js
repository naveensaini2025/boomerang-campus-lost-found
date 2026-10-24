import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authMiddleware } from '../utils/auth.js';

const router = express.Router();

router.get('/saved', authMiddleware, (req, res) => {
  try {
    const saved = db.prepare(`
      SELECT s.*, i.*, u.full_name as owner_name
      FROM saved_items s
      JOIN items i ON s.item_id = i.id
      JOIN users u ON i.user_id = u.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).all(req.userId);
    res.json({ saved });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-items', authMiddleware, (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
    res.json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT karma, returns_count FROM users WHERE id = ?').get(req.userId);
    const posted = db.prepare('SELECT COUNT(*) as count FROM items WHERE user_id = ?').get(req.userId);
    const claims = db.prepare('SELECT COUNT(*) as count FROM claims WHERE claimant_id = ?').get(req.userId);
    const received = db.prepare('SELECT COUNT(*) as count FROM claims WHERE owner_id = ?').get(req.userId);
    
    res.json({
      karma: user?.karma || 0,
      returns: user?.returns_count || 0,
      posted: posted.count,
      claims: claims.count,
      received: received.count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/leaderboard', (req, res) => {
  try {
    const leaders = db.prepare(`
      SELECT id, full_name, karma, returns_count, avatar
      FROM users
      WHERE karma > 0
      ORDER BY karma DESC, returns_count DESC
      LIMIT 10
    `).all();
    res.json({ leaders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
