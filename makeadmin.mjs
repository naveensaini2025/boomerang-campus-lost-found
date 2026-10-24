import db from './server/config/db.js';
db.prepare("UPDATE users SET role='admin' WHERE email='demo@boomerang.campus'").run();
console.log('admin set');
