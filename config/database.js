import initSqlJs from 'sql.js';

let db;

const initDatabase = async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();

  // Initialize database tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      user_type TEXT NOT NULL,
      is_verified BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS otp_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      otp TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS speaker_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      expertise TEXT NOT NULL,
      price_per_session DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS session_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      speaker_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      booking_date DATE NOT NULL,
      time_slot TIME NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (speaker_id) REFERENCES users(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
};

// Database wrapper for consistent API
const database = {
  prepare: (sql) => ({
    run: (...params) => {
      const stmt = db.prepare(sql);
      const result = stmt.run(params);
      stmt.free();
      return result;
    },
    get: (...params) => {
      const stmt = db.prepare(sql);
      const result = stmt.get(params);
      stmt.free();
      return result;
    },
    all: (...params) => {
      const stmt = db.prepare(sql);
      const result = stmt.all(params);
      stmt.free();
      return result;
    }
  }),
  exec: (sql) => db.exec(sql),
  close: () => db.close()
};

await initDatabase();

export default database;