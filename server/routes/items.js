import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authMiddleware, optionalAuth } from '../utils/auth.js';
import { upload } from '../utils/upload.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

function calculateMatchScore(lost, found) {
  let score = 0;
  const reasons = [];
  
  const lostWords = new Set((lost.title + ' ' + lost.description).toLowerCase().split(/\W+/).filter(w => w.length > 2));
  const foundWords = new Set((found.title + ' ' + found.description).toLowerCase().split(/\W+/).filter(w => w.length > 2));
  const intersection = new Set([...lostWords].filter(x => foundWords.has(x)));
  const union = new Set([...lostWords, ...foundWords]);
  if (union.size > 0) {
    const textScore = Math.round((intersection.size / union.size) * 40);
    score += textScore;
    if (textScore > 10) reasons.push('Similar description');
  }
  
  if (lost.category === found.category) {
    score += 20;
    reasons.push('Same category');
  }
  if (lost.color && found.color && lost.color.toLowerCase() === found.color.toLowerCase()) {
    score += 15;
    reasons.push('Same color');
  }
  if (lost.brand && found.brand && lost.brand.toLowerCase() === found.brand.toLowerCase()) {
    score += 10;
    reasons.push('Same brand');
  }
  if (lost.location && found.location && lost.location.toLowerCase().includes(found.location.toLowerCase().split(',')[0])) {
    score += 15;
    reasons.push('Nearby location');
  }
  
  return { score: Math.min(score, 100), reasons };
}

router.get('/', optionalAuth, (req, res) => {
  try {
    const { type, category, search, status = 'open,matched', limit = 50 } = req.query;
    let query = `
      SELECT i.*, u.full_name as owner_name, u.phone as owner_phone, u.email as owner_email
      FROM items i
      JOIN users u ON i.user_id = u.id
      WHERE i.status IN (${status.split(',').map(() => '?').join(',')})
    `;
    const params = status.split(',');
    
    if (type) {
      query += ' AND i.type = ?';
      params.push(type);
    }
    if (category) {
      query += ' AND i.category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (i.title LIKE ? OR i.description LIKE ? OR i.location LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY i.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const items = db.prepare(query).all(...params);
    res.json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', optionalAuth, (req, res) => {
  try {
    const item = db.prepare(`
      SELECT i.*, u.full_name as owner_name, u.phone as owner_phone, u.email as owner_email, u.karma as owner_karma
      FROM items i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = ?
    `).get(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    db.prepare('UPDATE items SET views = views + 1 WHERE id = ?').run(req.params.id);
    
    let isSaved = false;
    if (req.userId) {
      const saved = db.prepare('SELECT id FROM saved_items WHERE user_id = ? AND item_id = ?').get(req.userId, req.params.id);
      isSaved = !!saved;
    }
    
    const matches = db.prepare(`
      SELECT m.*, i.title, i.type, i.category, i.location, i.images
      FROM matches m
      JOIN items i ON (i.id = m.lost_item_id OR i.id = m.found_item_id) AND i.id != ?
      WHERE m.lost_item_id = ? OR m.found_item_id = ?
      ORDER BY m.score DESC
    `).all(req.params.id, req.params.id, req.params.id);
    
    res.json({ item, isSaved, matches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, upload.array('images', 5), (req, res) => {
  try {
    const { type, title, description, category, color, brand, location, landmark, dateLostFound, secretQuestion, secretAnswer } = req.body;
    
    if (!type || !title || !description || !category || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const id = uuidv4();
    const images = req.files ? JSON.stringify(req.files.map(f => `/uploads/${f.filename}`)) : '[]';
    const tags = JSON.stringify([category, color, brand].filter(Boolean));
    
    let secretAnswerHash = null;
    if (secretAnswer && type === 'found') {
      secretAnswerHash = bcrypt.hashSync(secretAnswer.toLowerCase().trim(), 10);
    }
    
    db.prepare(`
      INSERT INTO items (id, user_id, type, title, description, category, color, brand, location, landmark, date_lost_found, secret_question, secret_answer_hash, images, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.userId, type, title, description, category, color, brand, location, landmark, dateLostFound, secretQuestion, secretAnswerHash, images, tags);
    
    const allItems = db.prepare('SELECT * FROM items WHERE id != ?').all(id);
    const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    
    for (const existing of allItems) {
      if (existing.type !== newItem.type && existing.status === 'open') {
        const { score, reasons } = calculateMatchScore(
          newItem.type === 'lost' ? newItem : existing,
          newItem.type === 'found' ? newItem : existing
        );
        if (score >= 40) {
          const matchId = uuidv4();
          const lostId = newItem.type === 'lost' ? newItem.id : existing.id;
          const foundId = newItem.type === 'found' ? newItem.id : existing.id;
          try {
            db.prepare(`
              INSERT INTO matches (id, lost_item_id, found_item_id, score, match_reasons)
              VALUES (?, ?, ?, ?, ?)
            `).run(matchId, lostId, foundId, score, JSON.stringify(reasons));
          } catch (e) {}
        }
      }
    }
    
    if (allItems.some(e => e.type !== newItem.type)) {
      db.prepare('UPDATE items SET status = ? WHERE id = ?').run('matched', id);
    }
    
    res.status(201).json({ item: newItem, message: 'Item posted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (item.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { title, description, location, status } = req.body;
    db.prepare(`
      UPDATE items SET title = COALESCE(?, title), description = COALESCE(?, description), 
      location = COALESCE(?, location), status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, location, status, req.params.id);
    
    const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
    res.json({ item: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (item.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/save', authMiddleware, (req, res) => {
  try {
    const id = uuidv4();
    try {
      db.prepare('INSERT INTO saved_items (id, user_id, item_id) VALUES (?, ?, ?)').run(id, req.userId, req.params.id);
      res.json({ saved: true });
    } catch {
      db.prepare('DELETE FROM saved_items WHERE user_id = ? AND item_id = ?').run(req.userId, req.params.id);
      res.json({ saved: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
