// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

let navigationCallback: ((data: any) => void) | null = null;

contextBridge.exposeInMainWorld('electronChat', {
  db: {
    // 用户表
    addUser: (id, username, nickname, email, password, avatar, head_img, status) =>
      ipcRenderer.invoke('db:add-user', id, username, nickname, email, password, avatar, head_img, status),
    getUserById: (id) =>
      ipcRenderer.invoke('db:get-user-by-id', id),
    getUserByUsername: (username) =>
      ipcRenderer.invoke('db:get-user-by-username', username),
    updateUser: (id, fields) =>
      ipcRenderer.invoke('db:update-user', id, fields),
    deleteUser: (id) =>
      ipcRenderer.invoke('db:delete-user', id),

    // 会话表
    addConversation: (id, name, type, avatar, creator_id) =>
      ipcRenderer.invoke('db:add-conversation', id, name, type, avatar, creator_id),
    getConversationById: (id) =>
      ipcRenderer.invoke('db:get-conversation-by-id', id),
    updateConversation: (id, fields) =>
      ipcRenderer.invoke('db:update-conversation', id, fields),
    deleteConversation: (id) =>
      ipcRenderer.invoke('db:delete-conversation', id),

    // 会话成员表
    addConversationMember: (id, conversation_id, user_id, role, nickname) =>
      ipcRenderer.invoke('db:add-conversation-member', id, conversation_id, user_id, role, nickname),
    getConversationMembers: (conversation_id) =>
      ipcRenderer.invoke('db:get-conversation-members', conversation_id),
    updateConversationMember: (id, fields) =>
      ipcRenderer.invoke('db:update-conversation-member', id, fields),
    deleteConversationMember: (id) =>
      ipcRenderer.invoke('db:delete-conversation-member', id),

    // 消息表
    addMessage: (id, conversation_id, sender_id, content, message_type, is_revoked) =>
      ipcRenderer.invoke('db:add-message', id, conversation_id, sender_id, content, message_type, is_revoked),
    getMessageById: (id) =>
      ipcRenderer.invoke('db:get-message-by-id', id),
    getMessagesByConversation: (conversation_id, limit = 50) =>
      ipcRenderer.invoke('db:get-messages-by-conversation', conversation_id, limit),
    updateMessage: (id, fields) =>
      ipcRenderer.invoke('db:update-message', id, fields),
    deleteMessage: (id) =>
      ipcRenderer.invoke('db:delete-message', id),

    // 会话设置表
    addConversationSetting: (id, conversation_id, user_id, is_muted, custom_name, stick_on_top) =>
      ipcRenderer.invoke('db:add-conversation-setting', id, conversation_id, user_id, is_muted, custom_name, stick_on_top),
    getConversationSetting: (conversation_id, user_id) =>
      ipcRenderer.invoke('db:get-conversation-setting', conversation_id, user_id),
    updateConversationSetting: (id, fields) =>
      ipcRenderer.invoke('db:update-conversation-setting', id, fields),
    deleteConversationSetting: (id) =>
      ipcRenderer.invoke('db:delete-conversation-setting', id),
  }
});

// 导航相关（如需保留）
contextBridge.exposeInMainWorld('electronAPI', {
  navigate: (path: string, action: 'push' | 'replace' = 'push') => {
    ipcRenderer.send('NAVIGATE_TO', { path, action });
  },
  onNavigate: (callback: (data: { path: string; action: string }) => void) => {
    if (navigationCallback) {
      ipcRenderer.removeListener('REACT_NAVIGATE', navigationCallback);
    }
    navigationCallback = callback;
    ipcRenderer.on('REACT_NAVIGATE', (_, data) => {
      if (navigationCallback) {
        navigationCallback(data);
      }
    });
  },
  removeNavigationListener: () => {
    if (navigationCallback) {
      ipcRenderer.removeListener('REACT_NAVIGATE', navigationCallback);
      navigationCallback = null;
    }
  }
});
