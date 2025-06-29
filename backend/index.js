// backend/index.js

const express = require("express");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const csvParser = require("csv-parser");
const { exec } = require("child_process");

const app = express();
const PORT = 3100;

app.use(express.json()); // Cho phép parse JSON body

// Load CSV file (simulate ERP data)
function loadCSVData(path) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(path)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

// Load SQLite data (simulate ERP database)
function loadSQLiteData(dbPath, tableName) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
    db.close();
  });
}

// API to get CSV data
app.get("/csv", async (req, res) => {
  try {
    const data = await loadCSVData("data/ledger.csv");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API to get SQLite data
app.get("/sqlite", async (req, res) => {
  try {
    const data = await loadSQLiteData("data/ledger.db", "entries");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// home
app.get("/",async(req,res)=>{
    try{

        res.json({message: 'Helloworld'})

    }catch(err){
        res.status(500).json({error: err.message})
    }
})

// CRUD API cho entries (SQLite)

// Lấy toàn bộ entries
app.get("/entries", async (req, res) => {
  try {
    const db = new sqlite3.Database("data/ledger.db");
    db.all("SELECT * FROM entries", [], (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy 1 entry theo id
app.get("/entries/:id", async (req, res) => {
  try {
    const db = new sqlite3.Database("data/ledger.db");
    db.get("SELECT * FROM entries WHERE entry_id = ?", [req.params.id], (err, row) => {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Entry not found" });
      res.json(row);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm entry mới
app.post("/entries", async (req, res) => {
  const { entry_id, account_debit, account_credit, amount, currency, timestamp } = req.body;
  if (!entry_id || !account_debit || !account_credit || !amount || !currency || !timestamp) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const db = new sqlite3.Database("data/ledger.db");
    db.run(
      "INSERT INTO entries (entry_id, account_debit, account_credit, amount, currency, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
      [entry_id, account_debit, account_credit, amount, currency, timestamp],
      function (err) {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ success: true, id: entry_id });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật entry theo id
app.put("/entries/:id", async (req, res) => {
  const { account_debit, account_credit, amount, currency, timestamp } = req.body;
  try {
    const db = new sqlite3.Database("data/ledger.db");
    db.run(
      "UPDATE entries SET account_debit=?, account_credit=?, amount=?, currency=?, timestamp=? WHERE entry_id=?",
      [account_debit, account_credit, amount, currency, timestamp, req.params.id],
      function (err) {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Entry not found" });
        res.json({ success: true });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa entry theo id
app.delete("/entries/:id", async (req, res) => {
  try {
    const db = new sqlite3.Database("data/ledger.db");
    db.run("DELETE FROM entries WHERE entry_id = ?", [req.params.id], function (err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Entry not found" });
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API gọi smart contract (client.ts)
app.get("/solana", async (req, res) => {
  exec("npm run call-contract", { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message, stderr });
    }
    res.json({ stdout, stderr });
  });
});

app.listen(PORT, () => {
  console.log(`ERP backend API running at http://localhost:${PORT}`);
});
