import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authMiddleware } from '../utils/auth.js';

const router = express.Router();

router.get('/:claimId', authMiddleware, (req, res) => {
  try {
    const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    if (claim.claimant_id !== req.userId && claim.owner_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const messages = db.prepare(`
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.claim_id = ?
      ORDER BY m.created_at ASC
    `).all(req.params.claimId);
    
    res.json({ messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:claimId', authMiddleware, (req, res) => {
  try {
    const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    if (claim.claimant_id !== req.userId && claim.owner_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }
    
    const id = uuidv4();
    db.prepare('INSERT INTO messages (id, claim_id, sender_id, message) VALUES (?, ?, ?, ?)').run(id, req.params.claimId, req.userId, message);
    
    const newMessage = db.prepare(`
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(id);
    
    res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
