import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { generateToken, authMiddleware } from '../utils/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, rollNo, department, year } = req.body;
    
    if (!fullName || !password) {
      return res.status(400).json({ error: 'Full name and password are required' });
    }
    
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR phone = ?').get(email, phone);
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    
    db.prepare(`
      INSERT INTO users (id, full_name, email, phone, password_hash, roll_no, department, year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, fullName, email, phone, passwordHash, rollNo, department, year);
    
    const token = generateToken(id);
    const user = db.prepare('SELECT id, full_name, email, phone, roll_no, department, year, karma, returns_count, avatar FROM users WHERE id = ?').get(id);
    
    res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    
    if ((!email && !phone) || !password) {
      return res.status(400).json({ error: 'Email/Phone and password are required' });
    }
    
    const user = db.prepare('SELECT * FROM users WHERE email = ? OR phone = ?').get(email, phone);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    db.prepare('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    
    const token = generateToken(user.id);
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/demo-login', (req, res) => {
  try {
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get('demo@boomerang.campus');
    
    if (!user) {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO users (id, full_name, email, role, karma, returns_count)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, 'Campus Demo User', 'demo@boomerang.campus', 'student', 25, 3);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    }
    
    const token = generateToken(user.id);
    const { password_hash, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, full_name, email, phone, roll_no, department, year, karma, returns_count, avatar, role, created_at FROM users WHERE id = ?').get(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
