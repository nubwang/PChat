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
    // this.db.prepare('DROP TABLE IF EXISTS messages').run();
    //SELECT * FROM conversations ORDER BY updated_at DESC

    // console.log(this.db.prepare(` SELECT * FROM conversations ORDER BY updated_at DESC; `).all())

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
        user_id INTEGER NOT NULL,  -- 当前用户
        peer_type TEXT CHECK(peer_type IN ('user', 'group')) NOT NULL,
        peer_id INTEGER NOT NULL,

        -- 消息相关字段
        last_msg_id INTEGER,
        last_msg_content TEXT,
        last_msg_time TEXT DEFAULT (datetime('now')),

        -- 状态字段
        unread_count INTEGER DEFAULT 0,
        is_top INTEGER DEFAULT 0 CHECK(is_top IN (0, 1)),
        is_mute INTEGER DEFAULT 0 CHECK(is_mute IN (0, 1)),

        -- 元数据字段
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        group_name TEXT,
        group_avatar TEXT,
        avatar TEXT,  -- 头像数组
        nickname TEXT,  -- 对方昵称
        username TEXT,  -- 群成员用户名列表

        -- 唯一约束（避免重复会话）
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
          receiver_type TEXT NOT NULL CHECK (receiver_type IN ('user', 'group')),
          receiver_id INTEGER NOT NULL,
          content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'voice', 'file', 'location', 'emoji', 'system')),
          content TEXT,
          duration INTEGER,
          file_size INTEGER,
          status TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'received', 'read', 'failed', 'recalled')),
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          read_time DATETIME,
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
      );

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_receiver ON messages (receiver_type, receiver_id);
      CREATE INDEX IF NOT EXISTS idx_sender_time ON messages (sender_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_conversation_time ON messages (conversation_id, timestamp);
      -- 重复索引优化（SQLite自动合并相同索引）
      CREATE INDEX IF NOT EXISTS idx_status ON messages (status);
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
    if (!this.db) return "Database not initialized for user";
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO friends
        (user_id, head_img, username, status)
      VALUES
        (?, ?, ?, ?)
    `);
    return stmt.run(id, head_img, username, status);
  }

  getStatusFriends(status) {
    if (!this.db) return "Database not initialized for user";
    return this.db.prepare(`
      SELECT * FROM friends
      WHERE status = ?
    `).all(status);
  }

  getFriendByUserId(user_id) {
    if (!this.db) return "Database not initialized for user";
    return this.db.prepare(`SELECT * FROM friends WHERE user_id = ?`).get(user_id);
  }

  deleteFriendByUserId(userId) {
    if (!this.db) return "Database not initialized for user";
    const stmt = this.db.prepare("DELETE FROM friends WHERE user_id = ?");
    return stmt.run(userId);
  }

  changeFriendStatus(userId, newStatus) {
    if (!this.db) return "Database not initialized for user";
    const stmt = this.db.prepare("UPDATE friends SET status = ? WHERE user_id = ?");
    return stmt.run(newStatus, userId);
  }

  // 用户相关方法
  addUser(id, username, nickname, email, password, avatar = '', head_img = '', status = 'offline') {
    if (!this.db) return "Database not initialized for user";
    const stmt = this.db.prepare(`
      INSERT INTO users
        (id, username, nickname, email, password, avatar, head_img, status)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(id, username, nickname, email, password, avatar, head_img, status);
  }

  getUserById(id) {
    if (!this.db) return "Database not initialized for user";
    return this.db.prepare(`
      SELECT * FROM users
      WHERE id = ?
    `).get(id);
  }

  // 会话相关方法

  addConversation(conversations) {
    if (!this.db) return "Database not initialized for user";
    if (!conversations?.length) return true;

    try {
      // 1. 创建临时表（精确复制结构）
      this.db.exec(`
        CREATE TEMP TABLE IF NOT EXISTS temp_conversations (
          conversation_id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          peer_type TEXT NOT NULL,
          peer_id INTEGER NOT NULL,
          last_msg_id INTEGER,
          last_msg_content TEXT,
          last_msg_time TEXT,
          unread_count INTEGER,
          is_top INTEGER,
          is_mute INTEGER,
          created_at TEXT,
          updated_at TEXT,
          group_name TEXT,
          group_avatar TEXT,
          avatar TEXT,
          nickname TEXT,
          username TEXT
        );
      `);

      // 2. 清空临时表（确保干净状态）
      this.db.exec("DELETE FROM temp_conversations;");

      // 3. 准备插入语句（只需准备一次）
      const insertStmt = this.db.prepare(`
        INSERT INTO temp_conversations VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);

      // 4. 智能分批插入（每批30条）
      const batchSize = 30;
      for (let i = 0; i < conversations.length; i++) {
        const conv = conversations[i];

        // 直接运行预处理语句，不需要finalize
        insertStmt.run(
          conv.conversation_id,
          conv.user_id,
          conv.peer_type,
          conv.peer_id,
          conv.last_msg_id || null,
          conv.last_msg_content || null,
          conv.last_msg_time || new Date().toISOString(),
          conv.unread_count || 0,
          conv.is_top ? 1 : 0,
          conv.is_mute ? 1 : 0,
          conv.created_at || new Date().toISOString(),
          conv.updated_at || new Date().toISOString(),
          conv.group_name || null,
          conv.group_avatar ? JSON.stringify(conv.group_avatar) : null,
          conv.avatar || null,
          conv.nickname || null,
          conv.username || null
        );

        // 每处理完一个批次可以打印日志（可选）
        if (i > 0 && i % batchSize === 0 && process.env.NODE_ENV === 'development') {
          console.log(`已处理 ${i}/${conversations.length} 条会话`);
        }
      }

      // 5. 原子替换数据
      this.db.exec(`
        DELETE FROM conversations;
        INSERT OR REPLACE INTO conversations
        SELECT * FROM temp_conversations;
      `);

      // 6. 清理临时表
      this.db.exec("DROP TABLE temp_conversations;");

      // 验证结果
      const inserted = this.db.prepare("SELECT * FROM conversations").all();
      console.log(`成功插入会话数量: ${inserted.length}`);
      return true;
    } catch (error) {
      console.error("替换会话数据失败:", error);
      return false;
    }
  }

  getConversationAll() {
    if (!this.db) return "Database not initialized for user";
      return this.db.prepare(`
        SELECT * FROM conversations ORDER BY updated_at DESC;
      `).all();
    }

  // 消息相关方法
  addMessage({ msg_id, conversation_id, sender_id, receiver_type, receiver_id, content_type, content, duration = null, file_size = null, status = 'sending', timestamp = new Date().toISOString() }) {
    if (!this.db) throw new Error("Database not initialized");
    const stmt = this.db.prepare(` INSERT INTO messages ( msg_id, conversation_id, sender_id, receiver_type, receiver_id, content_type, content, duration, file_size, status, timestamp ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) `);
    const info = stmt.run( msg_id, conversation_id, sender_id, receiver_type, receiver_id, content_type, content, duration, file_size, status, timestamp );
    
    return { msg_id: msg_id || info.lastInsertRowid, timestamp };
  }

  // 在ChatDatabase类中新增批量插入方法
  addMessageAll(messages) {
    if (!this.db) throw new Error("Database not initialized");
    
    // 参数验证
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("Messages must be a non-empty array");
    }

    // 使用事务保证原子性
    return this.db.transaction(() => {
      // 创建参数化插入语句
      const stmt = this.db.prepare(`
        INSERT INTO messages (
          msg_id,
          conversation_id,
          sender_id,
          receiver_type,
          receiver_id,
          content_type,
          content,
          duration,
          file_size,
          status,
          timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // 批量绑定参数
      for (const msg of messages) {
        stmt.run(
          msg.msg_id || null,
          msg.conversation_id,
          msg.sender_id,
          msg.receiver_type,
          msg.receiver_id,
          msg.content_type,
          msg.content,
          msg.duration || null,
          msg.file_size || null,
          msg.status || 'sending',  // 默认状态
          msg.timestamp || new Date().toISOString()
        );
      }
    })();
  }

  getMessages(conversation_id, options = {}) {
    const { 
      limit = 20, 
      offset = 0,
      before = null,
      after = null,
      sender_id = null,
      status = null
    } = options;

    if (!this.db) throw new Error("Database not initialized");

    let query = `
      SELECT 
        msg_id,
        content_type,
        content,
        timestamp,
        status,
        (SELECT username FROM users WHERE id = messages.sender_id) AS sender_name
      FROM messages
      WHERE conversation_id = ?
    `;
    
    const params = [conversation_id];
    let conditions = [];

    // 添加时间范围过滤
    if (before) conditions.push(`timestamp < ?`);
    if (after) conditions.push(`timestamp > ?`);
    
    // 添加发送者过滤
    if (sender_id) conditions.push(`sender_id = ?`);
    
    // 添加状态过滤
    if (status) conditions.push(`status = ?`);

    // 组合查询条件
    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
      if (before) params.push(before);
      if (after) params.push(after);
      if (sender_id) params.push(sender_id);
      if (status) params.push(status);
    }

    // 添加排序和分页
    query += `
      ORDER BY timestamp DESC
      LIMIT ? 
      OFFSET ?
    `;
    params.push(limit, offset);

    return this.db.prepare(query).all(...params);
  }
}

// 创建单例实例，但不再直接导出
const chatDatabase = new ChatDatabase();
module.exports = chatDatabase;
