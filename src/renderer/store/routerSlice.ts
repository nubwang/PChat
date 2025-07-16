//补全socket

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RouterState {
  currentPath: string;
  previousPath: string | null;
}

const initialState: RouterState = {
  currentPath: "/", // 初始化为当前路径
  previousPath: "/",
};

export const routerSlice = createSlice({
  name: 'router',
  initialState,
  reducers: {
    setCurrentPath: (state, action: PayloadAction<string>) => {
      state.previousPath = state.currentPath;
      state.currentPath = action.payload;
    },
  },
});

export const { setCurrentPath } = routerSlice.actions;
export default routerSlice.reducer;