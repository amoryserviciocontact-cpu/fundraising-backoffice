import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = process.env.PORT || 10000;

const db = await open({
  filename: join(__dirname, 'base.db'),
  driver: sqlite3.Database
});
await db.run(`CREATE TABLE IF NOT EXISTS fundraisers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,
  email TEXT,
  patrocinador TEXT,
  recaudado REAL DEFAULT 0,
  comision REAL DEFAULT 0
)`);

app.get('/', async (_req, res) => {
  const rows = await db.all('SELECT * FROM fundraisers ORDER BY id');
  const total = rows.reduce((s, r) => s + r.recaudado, 0);
  const csv = `Nombre,Email,Patrocinador,Recaudado,Comision\n${rows.map(r => `${r.nombre},${r.email},${r.patrocinador},${r.recaudado},${r.comision}`).join('\n')}`;
  res.send(`<!doctype html><html lang="es"><head><title>Admin - Fundraising</title></head><body><h1>Total: $${total.toFixed(2)}</h1><table border="1"><tr><th>Nombre</th><th>Email</th><th>Patrocinador</th><th>Recaudado</th><th>Comisión</th></tr>${rows.map(r => `<tr><td>${r.nombre}</td><td>${r.email}</td><td>${r.patrocinador}</td><td>$${r.recaudado}</td><td>$${r.comision}</td></tr>`).join('')}</table><br><button onclick="window.open('data:text/csv,${encodeURIComponent(csv)}','_blank')">Descargar CSV</button></body></html>`);
});

app.use(express.json());
app.post('/registro', async (req, res) => {
  const { nombre, email, patrocinador } = req.body;
  await db.run('INSERT INTO fundraisers (nombre, email, patrocinador) VALUES (?,?,?)', [nombre, email, patrocinador]);
  res.json({ ok: true });
});

app.listen(port, () => console.log(`Render SQLite on ${port}`));
