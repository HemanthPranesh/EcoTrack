const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static("public"));

// Connect to SQLite Database
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to SQLite database.");
});

// Create Tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      region TEXT,
      totalCarbon REAL DEFAULT 0,
      totalActions INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      actionType TEXT,
      carbonValue REAL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});


// ===================== AUTH =====================

// REGISTER
app.post("/register", (req, res) => {
  const { name, email, password, region } = req.body;

  db.run(
    `INSERT INTO users (name, email, password, region)
     VALUES (?, ?, ?, ?)`,
    [name, email, password, region],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "User already exists" });
      }

      res.json({
        message: "User registered successfully",
        userId: this.lastID
      });
    }
  );
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE email = ? AND password = ?`,
    [email, password],
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json(user);
    }
  );
});


// ===================== CORE APIs =====================

// Add Action
app.post("/add-action", (req, res) => {
  const { userId, actionType, carbonValue } = req.body;

  db.run(
    `INSERT INTO actions (userId, actionType, carbonValue) VALUES (?, ?, ?)`,
    [userId, actionType, carbonValue],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.run(
        `UPDATE users
         SET totalCarbon = totalCarbon + ?,
             totalActions = totalActions + 1
         WHERE id = ?`,
        [carbonValue, userId],
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({ message: "Action added successfully" });
        }
      );
    }
  );
});

// Get User Data
app.get("/user/:id", (req, res) => {
  const userId = req.params.id;

  db.get(
    `SELECT * FROM users WHERE id = ?`,
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(row);
    }
  );
});

// Leaderboard by Region
app.get("/leaderboard/:region", (req, res) => {
  const region = req.params.region;

  db.all(
    `SELECT * FROM users 
     WHERE region = ?
     ORDER BY totalCarbon DESC 
     LIMIT 5`,
    [region],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Community Total
app.get("/community-total", (req, res) => {
  db.get(
    `SELECT SUM(totalCarbon) as total FROM users`,
    [],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ total: row.total || 0 });
    }
  );
});


// ===================== START SERVER =====================

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
