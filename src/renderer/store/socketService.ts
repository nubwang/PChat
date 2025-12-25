import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import {
  connectionEstablished,
  connectionLost,
  reconnecting,
  messageReceived,
  errorOccurred,
  joinRoomSuccess,
  leaveRoomSuccess,
  heartbeat as heartbeatAction,
} from './socketSlice';

interface SocketServiceConfig {
  url: string;
  options?: any;
  maxRetries?: number;
  baseDelay?: number;
}

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private listeners: Map<string, (data: any) => void> = new Map();
  private config: SocketServiceConfig | null = null;
  private retryCount = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastPingTime = 0;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public initialize(config: SocketServiceConfig): void {
    // 如果已存在连接，先断开
    if (this.socket) {
      this.disconnect();
    }
    this.config = {
      maxRetries: 5,
      baseDelay: 1000,
      ...config,
      options: {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: false,
        transports: ['websocket'],
        ...config.options,
      },
    };
    this.createSocket();
  }

  private createSocket(): void {
    if (!this.config?.url) {
      throw new Error('Connection URL not set. Call initialize() first.');
    }
    this.socket = io(this.config.url, this.config.options);
    this.setupEventListeners();
  }

  public async connect(): Promise<void> {
    if (!this.socket) throw new Error('Socket not initialized. Call initialize() first.');
    if (this.socket.connected) return;
    return new Promise((resolve, reject) => {
      const onConnect = () => { cleanup(); resolve(); };
      const onError = (err: Error) => { cleanup(); reject(err); };
      const cleanup = () => {
        this.socket?.off('connect', onConnect);
        this.socket?.off('connect_error', onError);
      };
      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onError);
      this.socket.connect();
    });
  }

  private setupEventListeners(): void {
    if (!this.socket) return;
    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('connect_error', this.handleConnectError.bind(this));
    this.socket.on('reconnect_attempt', this.handleReconnectAttempt.bind(this));
    this.socket.on('reconnect_failed', this.handleReconnectFailed.bind(this));
    this.socket.on('custom_pong', this.handlePong.bind(this));
  }

  private handleConnect(): void {
    this.retryCount = 0;
    store.dispatch(connectionEstablished());
    this.startHeartbeat();
    this.rejoinRooms();
    console.log('Socket connected:', this.socket?.id);
  }

  private handleDisconnect(reason: string): void {
    store.dispatch(connectionLost(reason));
    this.stopHeartbeat();
    console.log('Socket disconnected:', reason);
  }

  private handleConnectError(error: Error): void {
    try {
      // 如果是认证错误，跳转到登录页面
      console.log('Connection error:', error.message);
      if (error.message.includes('401')) {
        this.navigateTo('/login', 'replace');
        localStorage.removeItem('token'); // 清除无效 token
      }else {
        store.dispatch(errorOccurred(`Connection error: ${error.message}`));
      }
    } catch (e) {343
      store.dispatch(errorOccurred(`Connection error: ${error.message}`));
      console.error('Error handling connect error:', e);
    }
  }

  private handleReconnectAttempt(attempt: number): void {
    console.log(`Reconnection attempt ${attempt}`);
    this.retryCount = attempt;
    store.dispatch(reconnecting());
  }

  private handleReconnectFailed(): void {
    store.dispatch(errorOccurred('Failed to reconnect after multiple attempts'));
    console.error('Reconnection failed');
  }

  private handlePong(): void {
    console.log('Pong received');
    const latency = Date.now() - this.lastPingTime;
    store.dispatch(heartbeatAction(latency));
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    if (!this.socket?.connected) return;
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.lastPingTime = Date.now();
        this.socket.emit('custom_ping');
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  public navigateTo( path: string, action: 'push' | 'replace' = 'push', params?: Record<string, string> ):void {
  // 开发环境打印调试信息
  console.log('[Navigation]', { path, action, params });
  
  if (window.electronAPI) {
    // Electron 环境：通过 IPC 跳转
    window.electronAPI.navigate(path, action);
  } else {
    // 非 Electron 环境（如浏览器）
    const hashPath = `#${path}${params ? '?' + new URLSearchParams(params).toString() : ''}`;
    
    if (action === 'replace') {
      window.location.replace(hashPath); // 替换当前历史记录
    } else {
      window.location.hash = hashPath; // 默认 push 方式
    }
  }
}

  public disconnect(): void {
    this.stopHeartbeat();
    this.cleanupListeners();
    this.socket?.disconnect();
    this.socket = null;
  }

  public async joinRoom(room: string): Promise<void> {
    if (!this.socket?.connected) throw new Error('Socket not connected');
    return new Promise((resolve, reject) => {
      this.socket?.emit('join', room, (error: Error) => {
        if (error) reject(error);
        else {
          store.dispatch(joinRoomSuccess(room));
          resolve();
        }
      });
    });
  }

  public async leaveRoom(room: string): Promise<void> {
    if (!this.socket?.connected) throw new Error('Socket not connected');
    return new Promise((resolve, reject) => {
      this.socket?.emit('leave', room, (error: Error) => {
        if (error) reject(error);
        else {
          store.dispatch(leaveRoomSuccess(room));
          resolve();
        }
      });
    });
  }

  public async emit(event: string, data: any): Promise<any> {
    if (!this.socket?.connected) throw new Error('Socket not connected');
    return new Promise((resolve, reject) => {
      this.socket?.emit(event, data, (response: any) => {
        if (response?.error) reject(new Error(response.error));
        else resolve(response);
      });
    });
  }

  public subscribe(event: string, callback: (data: any) => void): void {
    if (!this.socket) return;
    const wrappedCallback = (data: any) => {
      store.dispatch(messageReceived({ event, data }));
      callback(data);
    };
    this.unsubscribe(event); // 保证不会重复绑定
    this.listeners.set(event, wrappedCallback);
    this.socket.on(event, wrappedCallback);
  }

  public unsubscribe(event: string): void {
    if (!this.socket) return;
    const storedCallback = this.listeners.get(event);
    if (storedCallback) {
      this.socket.off(event, storedCallback);
      this.listeners.delete(event);
    }
  }

  public cleanupListeners(): void {
    this.listeners.forEach((callback, event) => {
      this.socket?.off(event, callback);
    });
    this.listeners.clear();
  }

  private rejoinRooms(): void {
    const state = store.getState();
    const rooms = Array.isArray(state.socket.rooms) ? state.socket.rooms : [];
    rooms.forEach(room => {
      this.joinRoom(room).catch(error => {
        console.error(`Failed to rejoin room ${room}:`, error);
      });
    });
  }
}

export const socketService = SocketService.getInstance();