require('dotenv').config();
const db = require('../config/db');

console.log('Initializing database schema...');
const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
console.log('Tables present:', tables.map((t) => t.name).join(', '));

const pcount = db.prepare('SELECT COUNT(*) AS c FROM pollutants').get().c;
console.log(`Pollutants seeded: ${pcount}`);
console.log('Done.');
