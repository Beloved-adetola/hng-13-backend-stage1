const Database = require("better-sqlite3");
const db = new Database(process.env.DB_FILE || "data.db");

function init() {
  // Create the table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS strings (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      properties TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_value ON strings(value);
  `);

  const pragma = db.prepare("PRAGMA table_info(strings)").all();
  const columns = pragma.map((col) => col.name);

  const missing = [];
  if (!columns.includes("properties"))
    missing.push("ALTER TABLE strings ADD COLUMN properties TEXT;");
  if (!columns.includes("created_at"))
    missing.push("ALTER TABLE strings ADD COLUMN created_at TEXT;");
  if (missing.length) {
    for (const sql of missing) db.exec(sql);
    console.log(
      "Database schema updated: added missing columns →",
      missing.join(" ")
    );
  }
}

// Insert new string record
function insertString(id, value, properties, created_at) {
  const stmt = db.prepare(`
    INSERT INTO strings (id, value, properties, created_at)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(id, value, JSON.stringify(properties), created_at);
}

// Fetch by ID
function getById(id) {
  const row = db.prepare("SELECT * FROM strings WHERE id = ?").get(id);
  return row
    ? {
        id: row.id,
        value: row.value,
        properties: JSON.parse(row.properties || "{}"),
        created_at: row.created_at,
      }
    : null;
}

// Fetch by string value
function getByValue(value) {
  const row = db.prepare("SELECT * FROM strings WHERE value = ?").get(value);
  return row
    ? {
        id: row.id,
        value: row.value,
        properties: JSON.parse(row.properties || "{}"),
        created_at: row.created_at,
      }
    : null;
}

// Delete by string value
function deleteByValue(value) {
  const stmt = db.prepare("DELETE FROM strings WHERE value = ?");
  return stmt.run(value);
}

// List all stored strings
function listAll() {
  return db
    .prepare("SELECT * FROM strings ORDER BY created_at DESC")
    .all()
    .map((r) => ({
      id: r.id,
      value: r.value,
      properties: JSON.parse(r.properties || "{}"),
      created_at: r.created_at,
    }));
}

module.exports = {
  init,
  insertString,
  getById,
  getByValue,
  deleteByValue,
  listAll,
};
