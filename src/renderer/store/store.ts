import { configureStore } from '@reduxjs/toolkit';
import routerReducer from './routerSlice';

export const store = configureStore({
  reducer: {
    router: routerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;