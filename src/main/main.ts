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
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      contextIsolation: true, // 必须为 true 以确保安全
      sandbox: true,
      nodeIntegration: false,
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
// 用户表相关
ipcMain.handle('db:add-user', (event, id, username, nickname, email, password, avatar, head_img, status) => {
  return db.addUser(id, username, nickname, email, password, avatar, head_img, status);
});
ipcMain.handle('db:get-user-by-id', (event, id) => {
  return db.getUserById(id);
});
ipcMain.handle('db:get-user-by-username', (event, username) => {
  return db.getUserByUsername(username);
});
ipcMain.handle('db:update-user', (event, id, fields) => {
  return db.updateUser(id, fields);
});
ipcMain.handle('db:delete-user', (event, id) => {
  return db.deleteUser(id);
});

// 会话表相关
ipcMain.handle('db:add-conversation', (event, id, name, type, avatar, creator_id) => {
  return db.addConversation(id, name, type, avatar, creator_id);
});
ipcMain.handle('db:get-conversation-by-id', (event, id) => {
  return db.getConversationById(id);
});
ipcMain.handle('db:update-conversation', (event, id, fields) => {
  return db.updateConversation(id, fields);
});
ipcMain.handle('db:delete-conversation', (event, id) => {
  return db.deleteConversation(id);
});

// 会话成员表相关
ipcMain.handle('db:add-conversation-member', (event, id, conversation_id, user_id, role, nickname) => {
  return db.addConversationMember(id, conversation_id, user_id, role, nickname);
});
ipcMain.handle('db:get-conversation-members', (event, conversation_id) => {
  return db.getConversationMembers(conversation_id);
});
ipcMain.handle('db:update-conversation-member', (event, id, fields) => {
  return db.updateConversationMember(id, fields);
});
ipcMain.handle('db:delete-conversation-member', (event, id) => {
  return db.deleteConversationMember(id);
});

// 消息表相关
ipcMain.handle('db:add-message', (event, id, conversation_id, sender_id, content, message_type, is_revoked) => {
  return db.addMessage(id, conversation_id, sender_id, content, message_type, is_revoked);
});
ipcMain.handle('db:get-message-by-id', (event, id) => {
  return db.getMessageById(id);
});
ipcMain.handle('db:get-messages-by-conversation', (event, conversation_id, limit = 50) => {
  return db.getMessagesByConversation(conversation_id, limit);
});
ipcMain.handle('db:update-message', (event, id, fields) => {
  return db.updateMessage(id, fields);
});
ipcMain.handle('db:delete-message', (event, id) => {
  return db.deleteMessage(id);
});

// 会话设置表相关
ipcMain.handle('db:add-conversation-setting', (event, id, conversation_id, user_id, is_muted, custom_name, stick_on_top) => {
  return db.addConversationSetting(id, conversation_id, user_id, is_muted, custom_name, stick_on_top);
});
ipcMain.handle('db:get-conversation-setting', (event, conversation_id, user_id) => {
  return db.getConversationSetting(conversation_id, user_id);
});
ipcMain.handle('db:update-conversation-setting', (event, id, fields) => {
  return db.updateConversationSetting(id, fields);
});
ipcMain.handle('db:delete-conversation-setting', (event, id) => {
  return db.deleteConversationSetting(id);
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
