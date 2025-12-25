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
  chatData: any[];
  messages: any; // 消息数据
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
  chatData: [],
  messages: {},
};

export const routerSlice = createSlice({
  name: 'router',
  initialState,
  reducers: {
    initUser: (state, action: PayloadAction<any>) => {
      state.userData = action.payload;
    },
    messagesData: (state, action: PayloadAction<any>) => {
      const { conversationId, messages: newMessages } = action.payload;
      const existingMessages = state.messages[conversationId] || [];
      
      // 1. 创建消息ID索引集（O(1)查找性能）
      const existingIdSet = new Set(existingMessages.map(msg => msg.msg_id));
      
      // 2. 过滤掉重复的新消息
      const uniqueNewMessages = newMessages.filter(msg => !existingIdSet.has(msg.msg_id));
      
      if (uniqueNewMessages.length === 0) {
        return; // 没有新消息，直接返回
      }
      
      // 3. 合并所有消息（现有 + 新消息）
      const allMessages = [...existingMessages, ...uniqueNewMessages];
      
      // 4. 根据时间戳排序（假设 create_time 是时间戳或可排序的日期字符串）
      allMessages.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB; // 升序排序：最早的消息在前
      });
      // console.log('更新后的消息列表:', allMessages);
      
      // 5. 更新状态
      state.messages[conversationId] = allMessages;
    },
    setChatData: (state, action: PayloadAction<any>) => {
      state.chatData = action.payload;
    },
    updateConversation: (state, action) => {
      const newItem = action.payload;
      const index = state.chatData.findIndex(
        item => item.conversation_id === newItem.conversation_id
      );

      if (index !== -1) {
        // 存在时合并数据（保持不可变更新）
        state.chatData = state.chatData.map((item, i) =>
          i === index
            ? { ...item, ...newItem } // 合并新数据
            : item
        );
      } else {
        // 不存在时添加到数组最顶端
        state.chatData = [newItem, ...state.chatData];
      }
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

export const { setCurrentPath,changeTab,changeContersionId,changePage,pushMessageList,changeHasMore,initUser,setChatData,updateConversation,messagesData } = routerSlice.actions;
export default routerSlice.reducer;
