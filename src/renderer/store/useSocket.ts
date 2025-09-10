// src/hooks/useSocket.ts
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { socketService } from './socketService';
import { RootState } from '../store';
import {
  initializeSocket as initializeSocketAction,
  connectSocket as connectSocketAction,
  disconnectSocket as disconnectSocketAction,
  joinRoom as joinRoomAction,
  leaveRoom as leaveRoomAction,
  sendSocketMessage as sendMessageAction,
  reconnectSocket as reconnectSocketAction,
} from './socketThunks';

export const useSocket = () => {
  const dispatch = useDispatch();
  const socketState = useSelector((state: RootState) => state.socket);

  const initializeSocket = useCallback(
    (config: { url: string; options?: any }) => {
      return dispatch(initializeSocketAction(config));
    },
    [dispatch]
  );

  const connectSocket = useCallback(() => {
    return dispatch(connectSocketAction());
  }, [dispatch]);

  const disconnectSocket = useCallback(() => {
    return dispatch(disconnectSocketAction());
  }, [dispatch]);

  const joinRoom = useCallback(
    (room: string) => {
      return dispatch(joinRoomAction(room));
    },
    [dispatch]
  );

  const leaveRoom = useCallback(
    (room: string) => {
      return dispatch(leaveRoomAction(room));
    },
    [dispatch]
  );

  const sendMessage = useCallback(
    (event: string, data: any) => {
      return dispatch(sendMessageAction({ event, data }));
    },
    [dispatch]
  );

  const reconnectSocket = useCallback(() => {
    return dispatch(reconnectSocketAction());
  }, [dispatch]);

  const subscribe = useCallback(
    (event: string, callback: (data: any) => void) => {
      socketService.subscribe(event, callback);
    },
    []
  );

  const unsubscribe = useCallback(
    (event: string, callback?: (data: any) => void) => {
      socketService.unsubscribe(event, callback);
    },
    []
  );

  const cleanupListeners = useCallback(() => {
    socketService.cleanupListeners();
  }, []);

  const sendWithReconnect = useCallback(async (event: string, data: any) => {
    // 如果未连接，先尝试重连
    if (!socketState.isConnected) {
      await dispatch(reconnectSocketAction());
    }
    // 等待连接完成后再发送
    if (socketState.isConnected) {
      return dispatch(sendMessageAction({ event, data }));
    }
    return Promise.reject(new Error('Socket连接失败'));
  }, [dispatch, socketState.isConnected]);

  useEffect(() => {
    return () => {
      cleanupListeners();
    };
  }, [cleanupListeners]);

  return {
    ...socketState,
    initializeSocket,
    connectSocket,
    disconnectSocket,
    joinRoom,
    leaveRoom,
    sendMessage,
    reconnectSocket,
    subscribe,
    unsubscribe,
    cleanupListeners,
    sendWithReconnect
  };
};
