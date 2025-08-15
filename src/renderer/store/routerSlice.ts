//补全socket

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RouterState {
  currentPath: string;
  previousPath: string | null;
  tab: string | null; // 新增 tab 字段
}

const initialState: RouterState = {
  currentPath: "/", // 初始化为当前路径
  previousPath: "/",
  tab: '1', // 初始化为 null
};

export const routerSlice = createSlice({
  name: 'router',
  initialState,
  reducers: {
    setCurrentPath: (state, action: PayloadAction<string>) => {
      state.previousPath = state.currentPath;
      state.currentPath = action.payload;
    },
    changeTab: (state, action: PayloadAction<string | null>) => {
      state.tab = action.payload; // 更新 tab 字段
    } 
  },
});

export const { setCurrentPath,changeTab } = routerSlice.actions;
export default routerSlice.reducer;