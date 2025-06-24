// .electron/database.js
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class ChatDatabase {
  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'chat.db');
    this.db = new Database(this.dbPath);
    this.init();
  }

  init() {
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS userData (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(16) NOT NULL UNIQUE,
        nickname VARCHAR(16) NOT NULL UNIQUE,
        head_img VARCHAR(255) NOT NULL,
        crowd TEXT
      )
    `).run();
  }

  addMessage(chatId, senderId, content) {
    const stmt = this.db.prepare(
      'INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)'
    );
    stmt.run(chatId, senderId, content);
  }

  getMessages(id, limit = 50) {
    const stmt = this.db.prepare(
      'SELECT * FROM messages WHERE id = ? ORDER BY timestamp DESC LIMIT ?'
    );
    return stmt.all(chatId, limit);
  }
}

module.exports = new ChatDatabase();
