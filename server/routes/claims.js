import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authMiddleware } from '../utils/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/', authMiddleware, (req, res) => {
  try {
    const { itemId, answer, message } = req.body;
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }
    
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (item.user_id === req.userId) {
      return res.status(400).json({ error: 'You cannot claim your own item' });
    }
    
    const existing = db.prepare('SELECT * FROM claims WHERE item_id = ? AND claimant_id = ? AND status != "cancelled"').get(itemId, req.userId);
    if (existing) {
      return res.status(400).json({ error: 'You already have a claim on this item' });
    }
    
    const id = uuidv4();
    db.prepare(`
      INSERT INTO claims (id, item_id, claimant_id, owner_id, answer, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, itemId, req.userId, item.user_id, answer, message);
    
    if (item.type === 'found' && item.secret_answer_hash && answer) {
      const valid = bcrypt.compareSync(answer.toLowerCase().trim(), item.secret_answer_hash);
      if (!valid) {
        db.prepare('UPDATE claims SET status = ? WHERE id = ?').run('rejected', id);
        return res.status(400).json({ error: 'Incorrect answer to secret question' });
      }
    }
    
    db.prepare('UPDATE items SET status = ? WHERE id = ? AND status = "open"').run('claimed', itemId);
    
    res.status(201).json({ claim: { id }, message: 'Claim submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-claims', authMiddleware, (req, res) => {
  try {
    const claims = db.prepare(`
      SELECT c.*, i.title, i.type, i.category, i.images, i.location, u.full_name as owner_name
      FROM claims c
      JOIN items i ON c.item_id = i.id
      JOIN users u ON c.owner_id = u.id
      WHERE c.claimant_id = ?
      ORDER BY c.created_at DESC
    `).all(req.userId);
    res.json({ claims });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/received', authMiddleware, (req, res) => {
  try {
    const claims = db.prepare(`
      SELECT c.*, i.title, i.type, i.category, i.images, i.location, u.full_name as claimant_name, u.phone as claimant_phone
      FROM claims c
      JOIN items i ON c.item_id = i.id
      JOIN users u ON c.claimant_id = u.id
      WHERE c.owner_id = ?
      ORDER BY c.created_at DESC
    `).all(req.userId);
    res.json({ claims });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/approve', authMiddleware, (req, res) => {
  try {
    const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    if (claim.owner_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    db.prepare('UPDATE claims SET status = "approved", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    
    db.prepare('UPDATE claims SET status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE item_id = ? AND id != ? AND status = "pending"').run(claim.item_id, req.params.id);
    
    res.json({ message: 'Claim approved' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/reject', authMiddleware, (req, res) => {
  try {
    const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    if (claim.owner_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    db.prepare('UPDATE claims SET status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    res.json({ message: 'Claim rejected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/return', authMiddleware, (req, res) => {
  try {
    const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    if (claim.owner_id !== req.userId && claim.claimant_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    db.prepare('UPDATE items SET status = "returned", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(claim.item_id);
    
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(claim.item_id);
    if (item.type === 'found') {
      db.prepare('UPDATE users SET karma = karma + 10, returns_count = returns_count + 1 WHERE id = ?').run(item.user_id);
    } else if (item.type === 'lost') {
      db.prepare('UPDATE users SET karma = karma + 10, returns_count = returns_count + 1 WHERE id = ?').run(claim.claimant_id);
    }
    
    res.json({ message: 'Item marked as returned' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
