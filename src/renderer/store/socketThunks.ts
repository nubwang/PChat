// src/store/socketThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { socketService } from './socketService';
import { RootState } from './index';
import {
  connectionStarted,
  connectionEstablished,
  connectionLost,
  errorOccurred,
} from './socketSlice';

export const initializeSocket = createAsyncThunk(
  'socket/initialize',
  async (config: { url: string; options?: any }, { dispatch }) => {
    try {
      socketService.initialize(config);
      return true;
    } catch (error) {
      dispatch(errorOccurred(error instanceof Error ? error.message : 'Initialization failed'));
      throw error;
    }
  }
);

export const connectSocket = createAsyncThunk(
  'socket/connect',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      if (state.socket.isConnected) return true;

      dispatch(connectionStarted());

      // 添加超时处理
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });

      const connectPromise = socketService.connect();

      await Promise.race([connectPromise, timeout]);
      return true;
    } catch (error) {
      dispatch(errorOccurred(error instanceof Error ? error.message : String(error)));
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);


export const disconnectSocket = createAsyncThunk(
  'socket/disconnect',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      socketService.disconnect();
      dispatch(connectionLost());
      return true;
    } catch (error) {
      dispatch(errorOccurred(error instanceof Error ? error.message : 'Disconnection failed'));
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const joinRoom = createAsyncThunk(
  'socket/joinRoom',
  async (room: string, { dispatch, rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      if (state.socket.rooms.includes(room)) {
        return room; // 已经加入的房间
      }
      await socketService.joinRoom(room);
      return room;
    } catch (error) {
      dispatch(errorOccurred(error instanceof Error ? error.message : 'Failed to join room'));
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const leaveRoom = createAsyncThunk(
  'socket/leaveRoom',
  async (room: string, { dispatch, rejectWithValue }) => {
    try {
      await socketService.leaveRoom(room);
      return room;
    } catch (error) {
      dispatch(errorOccurred(error instanceof Error ? error.message : 'Failed to leave room'));
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const sendSocketMessage = createAsyncThunk(
  'socket/sendMessage',
  async (payload: { event: string; data: any }, { dispatch, rejectWithValue }) => {
    try {
      const response = await socketService.emit(payload.event, payload.data);
      return response;
    } catch (error) {
      dispatch(errorOccurred(error instanceof Error ? error.message : 'Failed to send message'));
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

// export const reconnectSocket = createAsyncThunk(
//   'socket/reconnect',
//   async (_, { dispatch, rejectWithValue }) => {
//     try {
//       dispatch(connectionStarted());
//       socketService.disconnect();
//       await socketService.connect();
//       return true;
//     } catch (error) {
//       dispatch(errorOccurred(error instanceof Error ? error.message : 'Reconnection failed'));
//       return rejectWithValue(error instanceof Error ? error.message : String(error));
//     }
//   }
// );

export const reconnectSocket = createAsyncThunk(
  'socket/reconnect',
  async (_, { dispatch }) => {
    try {
      // 尝试最多5次重连
      for (let i = 0; i < 5; i++) {
        try {
          await socketService.connect();
          return true;
        } catch (error) {
          // 指数退避等待
          await new Promise(resolve =>
            setTimeout(resolve, 1000 * Math.pow(2, i))
          );
        }
      }
      throw new Error('重连失败');
    } catch (error) {
      dispatch(errorOccurred(error.message));
      return Promise.reject(error);
    }
  }
);
