import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { authMiddleware } from '../utils/auth.js';
import { upload } from '../utils/upload.js';
import XLSX from 'xlsx';

const router = express.Router();

const adminOnly = (req, res, next) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.get('/dashboard', authMiddleware, adminOnly, (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const totalItems = db.prepare('SELECT COUNT(*) as count FROM items').get();
    const lostItems = db.prepare("SELECT COUNT(*) as count FROM items WHERE type='lost'").get();
    const foundItems = db.prepare("SELECT COUNT(*) as count FROM items WHERE type='found'").get();
    const openItems = db.prepare("SELECT COUNT(*) as count FROM items WHERE status='open'").get();
    const claimedItems = db.prepare("SELECT COUNT(*) as count FROM items WHERE status='claimed'").get();
    const returnedItems = db.prepare("SELECT COUNT(*) as count FROM items WHERE status='returned'").get();
    const totalClaims = db.prepare('SELECT COUNT(*) as count FROM claims').get();
    
    const recentItems = db.prepare(`
      SELECT i.*, u.full_name as owner_name
      FROM items i
      JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `).all();
    
    res.json({
      stats: {
        totalUsers: totalUsers.count,
        totalItems: totalItems.count,
        lostItems: lostItems.count,
        foundItems: foundItems.count,
        openItems: openItems.count,
        claimedItems: claimedItems.count,
        returnedItems: returnedItems.count,
        totalClaims: totalClaims.count
      },
      recentItems
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', authMiddleware, adminOnly, (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT id, full_name, email, phone, roll_no, department, year, section, role, karma, returns_count, is_active, created_at FROM users';
    const params = [];
    if (search) {
      query += ' WHERE full_name LIKE ? OR email LIKE ? OR roll_no LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY created_at DESC';
    const users = db.prepare(query).all(...params);
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { fullName, email, phone, rollNo, department, year, section, password, role = 'student' } = req.body;
    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR roll_no = ?').get(email, rollNo);
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const id = uuidv4();
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    
    db.prepare(`
      INSERT INTO users (id, full_name, email, phone, password_hash, roll_no, department, year, section, role, added_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, fullName, email, phone, passwordHash, rollNo, department, year, section, role, req.userId);
    
    res.status(201).json({ message: 'User created successfully', userId: id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:id', authMiddleware, adminOnly, (req, res) => {
  try {
    const { fullName, email, phone, rollNo, department, year, section, role, isActive } = req.body;
    db.prepare(`
      UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), 
      phone = COALESCE(?, phone), roll_no = COALESCE(?, roll_no), 
      department = COALESCE(?, department), year = COALESCE(?, year), 
      section = COALESCE(?, section), role = COALESCE(?, role), 
      is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(fullName, email, phone, rollNo, department, year, section, role, isActive, req.params.id);
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/users/:id', authMiddleware, adminOnly, (req, res) => {
  try {
    if (req.params.id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/upload-students', authMiddleware, adminOnly, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    let added = 0, skipped = 0;
    for (const row of data) {
      const fullName = row['Full Name'] || row['Name'] || row['full_name'];
      const email = row['Email'] || row['email'];
      const rollNo = row['Roll No'] || row['RollNo'] || row['roll_no'];
      const phone = row['Phone'] || row['phone'];
      const department = row['Department'] || row['dept'];
      const year = row['Year'] || row['year'];
      const section = row['Section'] || row['section'];
      
      if (!fullName) continue;
      
      const existing = db.prepare('SELECT id FROM users WHERE email = ? OR roll_no = ?').get(email, rollNo);
      if (existing) {
        skipped++;
        continue;
      }
      
      const id = uuidv4();
      db.prepare(`
        INSERT INTO users (id, full_name, email, phone, roll_no, department, year, section, added_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, fullName, email, phone, rollNo, department, year, section, req.userId);
      added++;
    }
    
    res.json({ message: `Added ${added} students, skipped ${skipped}`, added, skipped });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/items', authMiddleware, adminOnly, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT i.*, u.full_name as owner_name, u.email as owner_email
      FROM items i
      JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC
    `).all();
    res.json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/items/:id', authMiddleware, adminOnly, (req, res) => {
  try {
    const { title, description, status, location } = req.body;
    db.prepare(`
      UPDATE items SET title = COALESCE(?, title), description = COALESCE(?, description),
      status = COALESCE(?, status), location = COALESCE(?, location), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, status, location, req.params.id);
    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/items/:id', authMiddleware, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/claims', authMiddleware, adminOnly, (req, res) => {
  try {
    const claims = db.prepare(`
      SELECT c.*, i.title as item_title, u1.full_name as claimant_name, u2.full_name as owner_name
      FROM claims c
      JOIN items i ON c.item_id = i.id
      JOIN users u1 ON c.claimant_id = u1.id
      JOIN users u2 ON c.owner_id = u2.id
      ORDER BY c.created_at DESC
    `).all();
    res.json({ claims });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/make-admin/:id', authMiddleware, adminOnly, (req, res) => {
  try {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', req.params.id);
    res.json({ message: 'User promoted to admin' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
