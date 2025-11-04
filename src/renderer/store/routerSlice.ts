//补全socket

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RouterState {
  currentPath: string;
  previousPath: string | null;
  tab: string | null; // 新增 tab 字段
  contersionId: string | null; // 新增 tab 字段
  messageList: any[]; // 消息列表
  hasMore: boolean; // 是否有更多消息
  page: number; // 当前页码
  userData: any; // 用户数据
}

const initialState: RouterState = {
  currentPath: "/", // 初始化为当前路径
  previousPath: "/",
  tab: '1', // 初始化为 null
  contersionId: null,
  messageList: [],
  hasMore: true,
  page: 0,
  userData: null,
};

export const routerSlice = createSlice({
  name: 'router',
  initialState,
  reducers: {
    initUser: (state, action: PayloadAction<any>) => {
      state.userData = action.payload;
    },
    setCurrentPath: (state, action: PayloadAction<string>) => {
      state.previousPath = state.currentPath;
      state.currentPath = action.payload;
    },
    changeTab: (state, action: PayloadAction<string | null>) => {
      state.tab = action.payload; // 更新 tab 字段
    },
    changeContersionId: (state, action: PayloadAction<string | null>) => {
      state.contersionId = action.payload; // 更新 tab 字段
    },
    changePage: (state, action: PayloadAction<string | null>) => {
      state.page = action.payload;
    },
    pushMessageList: (state, action: PayloadAction<string | null>) => {
      state.messageList = action.payload;
    },
    changeHasMore: (state, action: PayloadAction<string | null>) => {
      state.hasMore = action.payload;
    },
  },
});

export const { setCurrentPath,changeTab,changeContersionId,changePage,pushMessageList,changeHasMore,initUser } = routerSlice.actions;
export default routerSlice.reducer;
