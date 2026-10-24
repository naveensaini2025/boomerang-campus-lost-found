import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import db from '../config/db.js';
import { authMiddleware } from '../utils/auth.js';

const router = express.Router();

router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { itemId, type = 'item' } = req.body;
    const id = uuidv4();
    
    const qrData = JSON.stringify({
      id,
      type,
      itemId,
      userId: req.userId,
      timestamp: Date.now()
    });
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData);
    
    db.prepare(`
      INSERT INTO qr_codes (id, user_id, item_id, qr_data, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.userId, itemId || null, qrData, type);
    
    res.json({ qrId: id, qrCode: qrCodeDataURL, qrData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-codes', authMiddleware, (req, res) => {
  try {
    const codes = db.prepare(`
      SELECT q.*, i.title 
      FROM qr_codes q 
      LEFT JOIN items i ON q.item_id = i.id 
      WHERE q.user_id = ? 
      ORDER BY q.created_at DESC
    `).all(req.userId);
    res.json({ codes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/scan/:qrId', (req, res) => {
  try {
    const qr = db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(req.params.qrId);
    if (!qr) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    
    db.prepare('UPDATE qr_codes SET scans = scans + 1 WHERE id = ?').run(req.params.qrId);
    
    res.json({ qr, data: JSON.parse(qr.qr_data) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
