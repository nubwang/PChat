// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

let navigationCallback: ((data: any) => void) | null = null;

contextBridge.exposeInMainWorld('electronChat', {
  db: {
    //好友
    saveFriend: (id, head_img,username, status) =>
      ipcRenderer.invoke('db:add-friend', id, head_img,username, status),
    getStatusFriends: (status) =>
      ipcRenderer.invoke('db:get-friends-by-status', status),
    getFriendByUserId: (userId) =>
      ipcRenderer.invoke('db:get-friends-by-user', userId),

    // 用户表
    addUser: (id, username, nickname, email, password, avatar, head_img, status) =>
      ipcRenderer.invoke('db:add-user', id, username, nickname, email, password, avatar, head_img, status),
    getUserById: (id) =>
      ipcRenderer.invoke('db:get-user-by-id', id),

    // 会话表  db:get-conversation-all
    getConversationAll: (id) =>
      ipcRenderer.invoke('db:get-conversation-all'),
    addConversation: (conversation_id, user_id, peer_type, peer_id, localstrongID) =>
      ipcRenderer.invoke('db:add-conversation',conversation_id, user_id, peer_type, peer_id,localstrongID),

    // 消息表
    addMessage: (msg_id, conversation_id, sender_id, receiver_type, receiver_id, content_type, content, duration, file_size) =>
      ipcRenderer.invoke('db:add-message',msg_id, conversation_id, sender_id, receiver_type, receiver_id, content_type, content, duration, file_size),
    getMessagesByConversation: (conversation_id, limit, offset) =>
      ipcRenderer.invoke('db:get-messages-by-conversation',conversation_id, limit, offset),
    login: (userId) =>
      ipcRenderer.invoke('login', { userId }),
    logout: () =>
      ipcRenderer.invoke('logout')
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
