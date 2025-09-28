const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class ChatDatabase {
  constructor() {
    // 不再在这里初始化数据库，改为由外部传入用户ID
    this.db = null;
    this.dbPath = null;
  }

  /**
   * 初始化用户数据库
   * @param {number} userId - 用户ID
   */
  initForUser(userId) {
    if (this.db) {
      this.close();
    }

    // 使用 Electron 的 userData 路径，避免权限问题
    this.dbPath = path.join(app.getPath('userData'), `user_${userId}.db`);
    // this.dbPath = path.join(userDbDir, `user_${userId}.db`);
    console.log(this.dbPath,'this.dbPath')
    // 打开数据库连接（如果文件不存在，better-sqlite3 会自动创建）
    this.db = new Database(this.dbPath);

    // 初始化表结构
    this.initSchema();
  }

  /**
   * 初始化数据库表结构
   */
  initSchema() {
    // 启用外键约束
    this.db.pragma("foreign_keys = ON");

    // 创建好友表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        head_img TEXT,
        username TEXT,
        status TEXT CHECK(status IN ('pending', 'accepted')) DEFAULT 'pending'
      )
    `);

    // 创建用户表（注意：这里存储的是好友信息，不是当前用户信息）
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
      )
    `);

    // 创建会话表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        conversation_id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,  -- 这里存储的是当前用户的ID（冗余字段，便于查询）
        peer_type TEXT CHECK(peer_type IN ('user', 'group')) NOT NULL,
        peer_id INTEGER NOT NULL,
        last_msg_id INTEGER,
        last_msg_content TEXT,
        last_msg_time TEXT DEFAULT (datetime('now')),
        unread_count INTEGER DEFAULT 0,
        is_top INTEGER DEFAULT 0 CHECK(is_top IN (0, 1)),
        is_mute INTEGER DEFAULT 0 CHECK(is_mute IN (0, 1)),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE (user_id, peer_type, peer_id)
      )
    `);

    // 创建群组表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pc_groups (
        group_id INTEGER PRIMARY KEY,
        group_name TEXT NOT NULL,
        creator_id INTEGER NOT NULL,
        avatar_url TEXT,
        announcement TEXT,
        max_members INTEGER DEFAULT 500,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // 创建群组成员表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS group_members (
        id INTEGER PRIMARY KEY,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT CHECK(role IN ('owner', 'admin', 'member')) DEFAULT 'member',
        join_time TEXT DEFAULT (datetime('now')),
        nick_in_group TEXT,
        last_read_msg_id INTEGER,
        FOREIGN KEY (group_id) REFERENCES pc_groups(group_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (group_id, user_id)
      )
    `);

    // 创建消息表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        msg_id INTEGER PRIMARY KEY,
        conversation_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        receiver_type TEXT CHECK(receiver_type IN ('user', 'group')) NOT NULL DEFAULT 'user',
        receiver_id INTEGER NOT NULL,
        content_type TEXT CHECK(content_type IN (
          'text', 'image', 'video', 'voice',
          'file', 'location', 'emoji', 'system'
        )) NOT NULL,
        content TEXT,
        duration INTEGER,
        file_size INTEGER,
        status TEXT CHECK(status IN (
          'sending', 'sent', 'received',
          'read', 'failed', 'recalled'
        )) DEFAULT 'sending',
        timestamp TEXT DEFAULT (datetime('now')),
        read_time TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
      )
    `);

    // 创建消息撤回表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS message_recalls (
        id INTEGER PRIMARY KEY,
        msg_id INTEGER NOT NULL,
        recaller_id INTEGER NOT NULL,
        recall_time TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (msg_id) REFERENCES messages(msg_id) ON DELETE CASCADE,
        FOREIGN KEY (recaller_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_receiver ON messages (receiver_type, receiver_id);
      CREATE INDEX IF NOT EXISTS idx_sender_time ON messages (sender_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_conversation_time ON messages (conversation_id, timestamp);
    `);

    // 创建自动更新时间戳的触发器
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_user_timestamp
      AFTER UPDATE ON users
      BEGIN
        UPDATE users SET updated_at = datetime('now') WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_conversation_timestamp
      AFTER UPDATE ON conversations
      BEGIN
        UPDATE conversations SET updated_at = datetime('now') WHERE conversation_id = OLD.conversation_id;
      END;
    `);
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPath = null;
    }
  }

  // 好友相关方法
  saveFriend(id, head_img, username, status) {
    if (!this.db) throw new Error('Database not initialized for user');
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO friends
        (user_id, head_img, username, status)
      VALUES
        (?, ?, ?, ?)
    `);
    return stmt.run(id, head_img, username, status);
  }

  getStatusFriends(status) {
    if (!this.db) throw new Error('Database not initialized for user');
    return this.db.prepare(`
      SELECT * FROM friends
      WHERE status = ?
    `).all(status);
  }

  getFriendByUserId(user_id) {
    if (!this.db) throw new Error('Database not initialized for user');
    return this.db.prepare(`SELECT * FROM friends WHERE user_id = ?`).get(user_id);
  }

  // 用户相关方法
  addUser(id, username, nickname, email, password, avatar = '', head_img = '', status = 'offline') {
    if (!this.db) throw new Error('Database not initialized for user');
    const stmt = this.db.prepare(`
      INSERT INTO users
        (id, username, nickname, email, password, avatar, head_img, status)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(id, username, nickname, email, password, avatar, head_img, status);
  }

  getUserById(id) {
    if (!this.db) throw new Error('Database not initialized for user');
    return this.db.prepare(`
      SELECT * FROM users
      WHERE id = ?
    `).get(id);
  }

  // 会话相关方法
  addConversation(conversation_id, user_id, peer_type, peer_id, localstrongID) {
    if (!this.db) throw new Error('Database not initialized for user');

    let stmt;
    // 验证conversation_id是否已经存在
    if (peer_type === 'user') {
      const existing = this.db.prepare(`
        SELECT * FROM conversations
        WHERE conversation_id = ?
      `).get(conversation_id);

      if (existing) {
        // 更新unread_count和updated_at字段
        existing.unread_count = 0;
        existing.updated_at = new Date().toISOString();
        const updateStmt = this.db.prepare(`
          UPDATE conversations
          SET unread_count = ?, updated_at = ?
          WHERE conversation_id = ?
        `);
        updateStmt.run(existing.unread_count, existing.updated_at, conversation_id);
        return existing;
      } else {
        stmt = this.db.prepare(`
          INSERT INTO conversations
            (conversation_id, user_id, peer_type, peer_id)
          VALUES (?, ?, ?, ?)
        `);
      }
    } else {
      stmt = this.db.prepare(`
        INSERT INTO conversations
          (conversation_id, user_id, peer_type, peer_id)
        VALUES (?, ?, ?, ?)
      `);
    }

    return stmt.run(conversation_id, user_id, peer_type, peer_id);
  }

  getConversationAll() {
    if (!this.db) throw new Error('Database not initialized for user');
    return this.db.prepare(`
      SELECT * FROM conversations ORDER BY updated_at DESC;
    `).all();
  }

  // 消息相关方法
  addMessage(msg_id, conversation_id, sender_id, receiver_type, receiver_id, content_type, content, duration = null, file_size = null) {
    if (!this.db) throw new Error('Database not initialized for user');
    const stmt = this.db.prepare(`
      INSERT INTO messages
        (msg_id, conversation_id, sender_id, receiver_type, receiver_id, content_type, content, duration, file_size)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(msg_id, conversation_id, sender_id, receiver_type, receiver_id, content_type, content, duration, file_size);
  }

  getMessagesByConversation(conversation_id, limit = 20, offset = 0) {
    if (!this.db) throw new Error('Database not initialized for user');
    return this.db.prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `).all(conversation_id, limit, offset);
  }
}

// 创建单例实例，但不再直接导出
const chatDatabase = new ChatDatabase();
module.exports = chatDatabase;
