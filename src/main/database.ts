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
    // 用户表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        nickname TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        avatar TEXT,
        head_img TEXT,
        status TEXT CHECK(status IN ('online', 'offline')) DEFAULT 'offline',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // 会话表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY,
        name TEXT,
        type TEXT CHECK(type IN ('private', 'group')) DEFAULT 'private',
        avatar TEXT,
        creator_id INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // 会话成员表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversation_members (
        id INTEGER PRIMARY KEY,
        conversation_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT CHECK(role IN ('member', 'admin', 'owner')) DEFAULT 'member',
        nickname TEXT,
        joined_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE (conversation_id, user_id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 消息表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY,
        conversation_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        message_type TEXT CHECK(message_type IN ('text', 'image', 'video', 'file', 'location', 'link')) DEFAULT 'text',
        is_revoked INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 会话设置表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversation_settings (
        id INTEGER PRIMARY KEY,
        conversation_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        is_muted INTEGER DEFAULT 0,
        custom_name TEXT,
        stick_on_top INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE (conversation_id, user_id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  }

  // ================= 用户表 =================
  addUser(id, username, nickname, email, password, avatar = '', head_img = '', status = 'offline') {
    const stmt = this.db.prepare(
      `INSERT INTO users (id, username, nickname, email, password, avatar, head_img, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    return stmt.run(id, username, nickname, email, password, avatar, head_img, status);
  }

  getUserById(id) {
    return this.db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
  }

  getUserByUsername(username) {
    return this.db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
  }

  updateUser(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    if (!keys.length) return;
    const setStr = keys.map(k => `${k} = ?`).join(', ') + ', updated_at = (datetime(\'now\'))';
    return this.db.prepare(`UPDATE users SET ${setStr} WHERE id = ?`).run(...values, id);
  }

  deleteUser(id) {
    return this.db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
  }

  // ================= 会话表 =================
  addConversation(id, toId, name, type = 'private', avatar = '', creator_id = null) {
    // 检查 id 是否已存在
    const existing = this.db.prepare(
      `SELECT * FROM conversations WHERE id = ?`
    ).get(id);

    if (existing) {
      // 更新 updated_at 字段为当前时间
      this.db.prepare(
        `UPDATE conversations SET updated_at = (datetime('now')) WHERE id = ?`
      ).run(id);

      // 返回最新的会话数据
      const updated = this.db.prepare(
        `SELECT * FROM conversations WHERE id = ?`
      ).get(id);

      return { inserted: false, conversation: updated, movedToTop: true };
    }

    const stmt = this.db.prepare(
      `INSERT INTO conversations (id, name, type, avatar, creator_id) VALUES (?, ?, ?, ?, ?)`
    );
    stmt.run(id, name, type, avatar, creator_id);

    // 返回新插入的会话
    const newConversation = this.db.prepare(
      `SELECT * FROM conversations WHERE id = ?`
    ).get(id);
    this.db.prepare(
      'INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?), (?, ?)'
    ).get(id, creator_id, id, toId);

    return { inserted: true, conversation: newConversation, movedToTop: false };
  }

  getConversationById(id) {
    return this.db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(id);
  }

  updateConversation(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    if (!keys.length) return;
    const setStr = keys.map(k => `${k} = ?`).join(', ') + ', updated_at = (datetime(\'now\'))';
    return this.db.prepare(`UPDATE conversations SET ${setStr} WHERE id = ?`).run(...values, id);
  }

  deleteConversation(id) {
    return this.db.prepare(`DELETE FROM conversations WHERE id = ?`).run(id);
  }

  // ================= 会话成员表 =================
  addConversationMember(id, conversation_id, user_id, role = 'member', nickname = null) {
    const stmt = this.db.prepare(
      `INSERT INTO conversation_members (id, conversation_id, user_id, role, nickname) VALUES (?, ?, ?, ?, ?)`
    );
    return stmt.run(id, conversation_id, user_id, role, nickname);
  }

  getConversationMembers(conversation_id) {
    return this.db.prepare(`SELECT * FROM conversation_members WHERE conversation_id = ?`).all(conversation_id);
  }

  updateConversationMember(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    if (!keys.length) return;
    const setStr = keys.map(k => `${k} = ?`).join(', ') + ', updated_at = (datetime(\'now\'))';
    return this.db.prepare(`UPDATE conversation_members SET ${setStr} WHERE id = ?`).run(...values, id);
  }

  deleteConversationMember(id) {
    return this.db.prepare(`DELETE FROM conversation_members WHERE id = ?`).run(id);
  }

  // ================= 消息表 =================
  addMessage(id, conversation_id, sender_id, content, message_type = 'text', is_revoked = 0) {
    const stmt = this.db.prepare(
      `INSERT INTO messages (id, conversation_id, sender_id, content, message_type, is_revoked) VALUES (?, ?, ?, ?, ?, ?)`
    );
    return stmt.run(id, conversation_id, sender_id, content, message_type, is_revoked);
  }

  getMessageById(id) {
    return this.db.prepare(`SELECT * FROM messages WHERE id = ?`).get(id);
  }

  getMessagesByConversation(conversation_id, limit = 50) {
    return this.db.prepare(
      `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?`
    ).all(conversation_id, limit);
  }

  updateMessage(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    if (!keys.length) return;
    const setStr = keys.map(k => `${k} = ?`).join(', ') + ', updated_at = (datetime(\'now\'))';
    return this.db.prepare(`UPDATE messages SET ${setStr} WHERE id = ?`).run(...values, id);
  }

  deleteMessage(id) {
    return this.db.prepare(`DELETE FROM messages WHERE id = ?`).run(id);
  }

  // ================= 会话设置表 =================
  addConversationSetting(id, conversation_id, user_id, is_muted = 0, custom_name = null, stick_on_top = 0) {
    const stmt = this.db.prepare(
      `INSERT INTO conversation_settings (id, conversation_id, user_id, is_muted, custom_name, stick_on_top) VALUES (?, ?, ?, ?, ?, ?)`
    );
    return stmt.run(id, conversation_id, user_id, is_muted, custom_name, stick_on_top);
  }

  getConversationSetting(conversation_id, user_id) {
    return this.db.prepare(
      `SELECT * FROM conversation_settings WHERE conversation_id = ? AND user_id = ?`
    ).get(conversation_id, user_id);
  }

  updateConversationSetting(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    if (!keys.length) return;
    const setStr = keys.map(k => `${k} = ?`).join(', ') + ', updated_at = (datetime(\'now\'))';
    return this.db.prepare(`UPDATE conversation_settings SET ${setStr} WHERE id = ?`).run(...values, id);
  }

  deleteConversationSetting(id) {
    return this.db.prepare(`DELETE FROM conversation_settings WHERE id = ?`).run(id);
  }
}

module.exports = new ChatDatabase();
