import db from './config/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

db.prepare('DELETE FROM items').run();
db.prepare('DELETE FROM users WHERE email != ?').run('demo@boomerang.campus');
db.prepare('DELETE FROM claims').run();
db.prepare('DELETE FROM matches').run();
db.prepare('DELETE FROM messages').run();

const demoId = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@boomerang.campus')?.id || uuidv4();
if (!db.prepare('SELECT id FROM users WHERE email = ?').get('demo@boomerang.campus')) {
  db.prepare(`
    INSERT INTO users (id, full_name, email, role, karma, returns_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(demoId, 'Campus Demo User', 'demo@boomerang.campus', 'student', 25, 3);
}

const users = [
  { id: uuidv4(), name: 'Arjun Mehta', email: 'arjun@glbajaj.ac.in' },
  { id: uuidv4(), name: 'Riya Verma', email: 'riya@glbajaj.ac.in' },
  { id: uuidv4(), name: 'Simran Kaur', email: 'simran@glbajaj.ac.in' },
  { id: uuidv4(), name: 'Kabir Ali', email: 'kabir@glbajaj.ac.in' },
];

for (const u of users) {
  db.prepare(`INSERT OR IGNORE INTO users (id, full_name, email) VALUES (?, ?, ?)`).run(u.id, u.name, u.email);
}

const items = [
  { id: uuidv4(), user_id: demoId, type: 'lost', title: 'Student ID Card', description: 'Lost white student ID card near library entrance', category: 'ID Card', color: 'White', brand: 'GL Bajaj', location: 'Library, Block B', images: '[]' },
  { id: uuidv4(), user_id: users[0].id, type: 'found', title: 'Black Wallet', description: 'Black leather wallet with student ID inside found near canteen', category: 'Wallet', color: 'Black', brand: 'Puma', location: 'Canteen, Block A', images: '[]', secret_question: 'What is on the lock-screen wallpaper?', secret_answer_hash: bcrypt.hashSync('a golden retriever', 10) },
  { id: uuidv4(), user_id: demoId, type: 'lost', title: 'Black Wallet', description: 'Black leather wallet with student ID inside lost near canteen', category: 'Wallet', color: 'Black', brand: 'Puma', location: 'Canteen, Block A', images: '[]' },
  { id: uuidv4(), user_id: users[1].id, type: 'found', title: 'Student ID Card', description: 'Found white student ID card near library entrance', category: 'ID Card', color: 'White', brand: 'GL Bajaj', location: 'Library, Block B', images: '[]', secret_question: 'What name is printed on the ID card?', secret_answer_hash: bcrypt.hashSync('campus demo user', 10) },
  { id: uuidv4(), user_id: users[2].id, type: 'lost', title: 'Blue Earphones', description: 'Blue boat earbuds left in Lab 3 after practical exam', category: 'Electronics', color: 'Blue', brand: 'boAt', location: 'Lab 3, Block C', images: '[]' },
  { id: uuidv4(), user_id: demoId, type: 'found', title: 'Steel Water Bottle', description: 'Found steel water bottle on basketball court bench', category: 'Bottle', color: 'Silver', brand: 'Milton', location: 'Basketball Court', images: '[]', secret_question: 'What sticker is on the bottle?', secret_answer_hash: bcrypt.hashSync('a red lightning bolt', 10) },
];

for (const item of items) {
  db.prepare(`
    INSERT INTO items (id, user_id, type, title, description, category, color, brand, location, images, secret_question, secret_answer_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(item.id, item.user_id, item.type, item.title, item.description, item.category, item.color, item.brand, item.location, item.images, item.secret_question || null, item.secret_answer_hash || null);
}

console.log('✅ Database seeded with demo data');
console.log(`📦 ${items.length} items added`);
