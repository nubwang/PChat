// src/store/socketSlice.ts
import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';

interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: any;
  error: string | null;
  rooms: string[];
  isReconnecting: boolean;
  connectionTime: number | null;
  lastActivity: number | null;
  latency: number;
}

const initialState: SocketState = {
  isConnected: false,
  isConnecting: false,
  lastMessage: null,
  error: null,
  rooms: [],
  isReconnecting: false,
  connectionTime: null,
  lastActivity: null,
  latency: 0,
};

export const socketSlice = createSlice({
  name: 'socket',
  initialState: {
    ...initialState,
    latency: 0
  },
  reducers: {
    connectionStarted: (state) => {
      state.isConnecting = true;
      state.error = null;
    },
    connectionEstablished: (state) => {
      state.isConnected = true;
      state.isConnecting = false;
      state.isReconnecting = false;
      state.error = null;
      state.connectionTime = Date.now();
      state.lastActivity = Date.now();
    },
    connectionLost: (state) => {
      state.isConnected = false;
      state.isConnecting = false;
    },
    reconnecting: (state) => {
      state.isReconnecting = true;
    },
    messageReceived: (state, action: PayloadAction<any>) => {
      state.lastMessage = action.payload;
      state.lastActivity = Date.now();
    },
    errorOccurred: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.lastActivity = Date.now();
    },
    joinRoomSuccess: (state, action: PayloadAction<string>) => {
      if (!state.rooms.includes(action.payload)) {
        state.rooms.push(action.payload);
      }
      state.lastActivity = Date.now();
    },
    leaveRoomSuccess: (state, action: PayloadAction<string>) => {
      state.rooms = state.rooms.filter(room => room !== action.payload);
      state.lastActivity = Date.now();
    },
    resetSocketState: () => initialState,
    heartbeat: (state, action: PayloadAction<number>) => {
      state.latency = action.payload;
      state.lastActivity = Date.now();
    },
  },
});

// 选择器
export const selectSocketState = (state: { socket: SocketState }) => state.socket;
export const selectIsConnected = createSelector(
  selectSocketState,
  (socket) => socket.isConnected
);
export const selectActiveRooms = createSelector(
  selectSocketState,
  (socket) => socket.rooms
);
export const selectLastActivity = createSelector(
  selectSocketState,
  (socket) => socket.lastActivity
);
export const selectConnectionStatus = createSelector(
  selectSocketState,
  (socket) => ({
    isConnected: socket.isConnected,
    isConnecting: socket.isConnecting,
    isReconnecting: socket.isReconnecting
  })
);
 
export const selectConnectionDetails = createSelector(
  selectSocketState,
  (socket) => ({
    connectionTime: socket.connectionTime,
    lastActivity: socket.lastActivity,
    latency: socket.latency // 新增的延迟状态
  })
);

export const {
  connectionStarted,
  connectionEstablished,
  connectionLost,
  reconnecting,
  messageReceived,
  errorOccurred,
  joinRoomSuccess,
  leaveRoomSuccess,
  resetSocketState,
  heartbeat,
} = socketSlice.actions;

export default socketSlice.reducer;