import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { generateToken, authMiddleware } from '../utils/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { fullName, password, rollNo, collegeSerialNo, email, phone, department, year, section } = req.body;
    
    if (!fullName || !password || !rollNo || !collegeSerialNo) {
      return res.status(400).json({ error: 'Full name, password, Roll No and College Serial No are required' });
    }
    
    const existing = db.prepare('SELECT id FROM users WHERE roll_no = ? OR college_serial_no = ? OR email = ?').get(rollNo, collegeSerialNo, email);
    if (existing) {
      return res.status(400).json({ error: 'User already exists with this Roll No or College Serial No' });
    }
    
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    
    db.prepare(`
      INSERT INTO users (id, full_name, email, phone, password_hash, roll_no, college_serial_no, department, year, section)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, fullName, email || null, phone || null, passwordHash, rollNo, collegeSerialNo, department, year, section);
    
    const token = generateToken(id);
    const user = db.prepare('SELECT id, full_name, email, phone, roll_no, college_serial_no, department, year, section, karma, returns_count, avatar, role FROM users WHERE id = ?').get(id);
    
    res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { rollNo, collegeSerialNo, password } = req.body;
    
    if ((!rollNo && !collegeSerialNo) || !password) {
      return res.status(400).json({ error: 'Roll No/College Serial No and password are required' });
    }
    
    const user = db.prepare('SELECT * FROM users WHERE roll_no = ? OR college_serial_no = ?').get(rollNo, collegeSerialNo);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account deactivated. Contact admin.' });
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
    const user = db.prepare('SELECT id, full_name, email, phone, roll_no, college_serial_no, department, year, section, karma, returns_count, avatar, role, created_at FROM users WHERE id = ?').get(req.userId);
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
