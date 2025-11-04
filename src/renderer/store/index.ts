import { configureStore } from '@reduxjs/toolkit';
import routerReducer from './routerSlice';
import socketReducer from './socketSlice';

export const store = configureStore({
  reducer: {
    router: routerReducer,
    socket: socketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware(),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
