const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb, saveDb } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const COLOR_MAP = {
  "7h00-13h30": "#3498db",
  "8h00-15h30": "#2ecc71",
  "9h00-16h30": "#1abc9c",
  "13h30-21h00": "#9b59b6",
  "20h45-7h15":  "#2c3e50",
  "Repos":       "#95a5a6",
  "Vacances":    "#f1c40f"
};

const MODIFIED_COLOR = "#e67e22";
let db;

// Récupérer tous les horaires
app.get('/api/schedules', (req, res) => {
  const stmt = db.prepare('SELECT * FROM schedules ORDER BY date ASC');
  const schedules = [];
  while (stmt.step()) {
    schedules.push(stmt.getAsObject());
  }
  stmt.free();
  res.json(schedules);
});

// Ajouter un horaire
app.post('/api/schedules', (req, res) => {
  const { date, shiftType, isModified } = req.body;
  if (!COLOR_MAP[shiftType]) return res.status(400).json({ error: "Type invalide" });

  const color = isModified ? MODIFIED_COLOR : COLOR_MAP[shiftType];
  const modifiedValue = isModified ? 1 : 0;

  db.run(
    `INSERT INTO schedules (date, shift_type, color, is_modified) VALUES (?, ?, ?, ?)`,
    [date, shiftType, color, modifiedValue]
  );
  saveDb(db);
  res.status(201).json({ message: "Horaire ajouté" });
});

// Mettre à jour un horaire existant
app.put('/api/schedules/:id', (req, res) => {
  const { id } = req.params;
  const { shiftType, isModified } = req.body;
  if (!COLOR_MAP[shiftType]) return res.status(400).json({ error: "Type invalide" });

  const color = isModified ? MODIFIED_COLOR : COLOR_MAP[shiftType];
  const modifiedValue = isModified ? 1 : 0;

  db.run(
    `UPDATE schedules SET shift_type = ?, color = ?, is_modified = ? WHERE id = ?`,
    [shiftType, color, modifiedValue, id]
  );
  saveDb(db);
  res.json({ message: "Horaire mis à jour" });
});

// Supprimer un horaire
app.delete('/api/schedules/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM schedules WHERE id = ?`, [id]);
  saveDb(db);
  res.json({ message: "Horaire supprimé" });
});

getDb().then(database => {
  db = database;
  app.listen(3000, () => console.log('App disponible sur http://localhost:3000'));
});
