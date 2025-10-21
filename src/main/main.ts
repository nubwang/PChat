/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
const db = require('./database');
console.log('Module path:', require.resolve('better-sqlite3'));

app.commandLine.appendSwitch('disable-renderer-backgrounding'); // 防止渲染进程后台化
app.commandLine.appendSwitch('enable-web-bluetooth'); // 增强系统 API 兼容性


class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});
ipcMain.on('NAVIGATE_TO', (_, { path, action }) => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('REACT_NAVIGATE', {
      path,
      action: action || 'push' // 确保默认值
    });
  }
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    titleBarStyle: 'hidden',
    show: false,
    width: 1024,
    height: 728,
    enableBlinkFeatures: 'InputMethodEditor',
    icon: getAssetPath('icon.png'),
    webPreferences: {
      contextIsolation: true, // 必须为 true 以确保安全
      sandbox: true,
      nodeIntegration: false,
      partition: `persist:instance${process.env.ELECTRON_PORT}`,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */
// 存储当前用户ID
let currentUserId = null;
ipcMain.handle('login', async (event, { userId }) => {
  try {
    currentUserId = userId;
    db.initForUser(userId);
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
});
// 登出时关闭数据库
ipcMain.handle('logout', async (event) => {
  try {
    db.close();
    currentUserId = null;
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
});
// 好友表 getFriendByUserId changeFriendStatus deleteFriendByUserId
ipcMain.handle('db:add-friend', (event, id, head_img,username, status) => {
  return db.saveFriend(id, head_img,username, status);
});
ipcMain.handle('db:get-friends-by-status', (event, status) => {
  return db.getStatusFriends(status);
});
ipcMain.handle('db:get-friends-by-user', (event, userId) => {
  return db.getFriendByUserId(userId);
});
ipcMain.handle('db:change-friend-status', (event, userId,newStatus) => {
  return db.changeFriendStatus(userId,newStatus);
});
ipcMain.handle('db:delete-friend-by-user-id', (event, userId) => {
  return db.deleteFriendByUserId(userId);
});

// 用户表相关
ipcMain.handle('db:add-user', (event, id, username, nickname, email, password, avatar, head_img, status) => {
  return db.addUser(id, username, nickname, email, password, avatar, head_img, status);
});
ipcMain.handle('db:get-user-by-id', (event, id) => {
  return db.getUserById(id);
});
//getConversationAll addConversation(conversation_id,user_id, peer_type, peer_id)
ipcMain.handle('db:get-conversation-all', (event) => {
  return db.getConversationAll();
});

ipcMain.handle('db:add-conversation', (event, conversation_id,user_id, peer_type, peer_id, localstrongID) => {
  return db.addConversation(conversation_id,user_id, peer_type, peer_id, localstrongID);
});

ipcMain.handle('db:add-message', (event, msg_id, conversation_id, sender_id, receiver_type, receiver_id, content_type, content, duration, file_size) => {
  return db.addMessage(msg_id, conversation_id, sender_id, receiver_type, receiver_id, content_type, content, duration, file_size);
});

ipcMain.handle('db:get-messages-by-conversation', (event, conversation_id, limit, offset) => {
  return db.getMessagesByConversation(conversation_id, limit, offset);
});

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
