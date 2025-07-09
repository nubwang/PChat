// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';
let navigationCallback: ((data: any) => void) | null = null;

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};
contextBridge.exposeInMainWorld('electronChat', {
  db: {
    addMessage: (chatId, senderId, content) =>
      ipcRenderer.invoke('db:add-message', chatId, senderId, content),
    getMessages: (id) =>
      ipcRenderer.invoke('db:get-messages', id)
  },
  cache: {
    // 后续可扩展 IndexedDB 操作
  }
});
contextBridge.exposeInMainWorld('electronAPI', {
  navigate: (path: string, action: 'push' | 'replace' = 'push') => {
    ipcRenderer.send('NAVIGATE_TO', { path, action });
  },
  onNavigate: (callback: (data: { path: string; action: string }) => void) => {
    // 移除旧监听器
    if (navigationCallback) {
      ipcRenderer.removeListener('REACT_NAVIGATE', navigationCallback);
    }
    
    navigationCallback = callback;
    ipcRenderer.on('REACT_NAVIGATE', (_, data) => {
      if (navigationCallback) {
        navigationCallback(data); // 安全调用
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

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
