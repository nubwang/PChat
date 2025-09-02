import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, Input, Button, message, Empty, List, Spin } from 'antd';
import {
  SmileOutlined,
  PaperClipOutlined,
  AudioOutlined,
  SendOutlined,
} from '@ant-design/icons';
import './style.css';
import { useSocket } from '../../store/useSocket';

const { TextArea } = Input;

// 类型定义
interface Message {
  id: string | number;
  content: string;
  create_time: string;
  sender_id: string | number;
}

interface ChatData {
  conversation_id: string;
  user_id: string;
  peer_type: string;
  peer_id: string;
  name?: string;
}

const ChatWindow: React.FC<{ chatData?: ChatData }> = ({ chatData }) => {
  // 状态管理
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Socket 连接
  const { sendMessage, subscribe } = useSocket();

  // 加载历史消息（优化版）
  const loadHistoryMessages = useCallback(async () => {
    if (!hasMore || isLoadingHistory || !chatData) return;

    setIsLoadingHistory(true);
    try {
      // 模拟API调用
      const mockData = Array(20).fill(0).map((_, i) => ({
        id: `${Date.now()}-${i}`,
        content: `历史消息 ${messages.length + i + 1}`,
        create_time: new Date().toLocaleTimeString(),
        sender_id: chatData.peer_id,
      }));

      // 保持滚动位置
      const container = messageContainerRef.current;
      const prevScrollHeight = container?.scrollHeight || 0;

      setMessages(prev => [...mockData, ...prev]);
      setPage(p => p + 1);
      setHasMore(messages.length + mockData.length < 100); // 示例条件

      // 优化滚动恢复
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [hasMore, isLoadingHistory, messages.length, chatData]);

  // 滚动处理（优化版）
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    console.log(scrollTop, scrollHeight, clientHeight, 'scrollTop');
    // 滚动到顶部加载更多
    if (scrollTop < 100 && hasMore && !isLoadingHistory) {
      loadHistoryMessages();
    }
  }, [hasMore, isLoadingHistory, loadHistoryMessages]);

  // 消息订阅（优化内存管理）
  useEffect(() => {
    if (!chatData) return;

    // 初始化加载历史消息
    loadHistoryMessages();

    const handleNewMessage = (data: any) => {
      if (data.code === 200) {
        let newData = data.data;
        console.log(newData.messageId,'newMessage');
        setMessages(prev => [...prev, newData]);
        window.electronChat.db.addMessage(
          newData.messageId,
          newData.conversation_id,
          newData.sender_id,
          newData.receiver_type,
          newData.receiver_id,
          newData.content_type,
          newData.content,
          null,
          null
        ).then((res)=>{ console.log(res,'addMessage'); }).catch((error) => { console.error('Error adding message:', error); });
      } else {
        message.error('获取消息失败');
      }
    };

    let unsubscribe = subscribe('newMessage', handleNewMessage);
    return () => unsubscribe?.();
  }, [chatData, loadHistoryMessages]);

  // 发送消息（优化参数处理）
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || !chatData) return;

    const params = {
      conversation_id: chatData.conversation_id,
      sender_id: chatData.user_id,
      receiver_type: chatData.peer_type,
      receiver_id: chatData.peer_id,
      content_type: 'text',
      content: inputValue.trim(),
    };

    sendMessage('sendMessage', params);
    setInputValue('');
  }, [inputValue, chatData, sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-window">
      {chatData ? (
        <>
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-title">{chatData.name}</span>
            </div>
          </div>

          <div className="message-container" onScroll={handleScroll} ref={messageContainerRef}>
            <List
              loading={isLoadingHistory}
              // loadMore={
              //   <div style={{ textAlign: 'center', padding: 10 }}>
              //     {isLoadingHistory ? <Spin size="small" /> : hasMore ? '加载更多' : '没有更多了'}
              //   </div>
              // }
              dataSource={messages}
              split={false}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <div className={`message-item ${
                    item.sender_id === chatData.user_id ? 'sent' : 'received'
                  }`}>
                    {item.sender_id !== chatData.user_id && (
                      <Avatar src={require('../../../static/img/3.jpeg')} />
                    )}
                    <div className="message-content">
                      <div className="message-text">{item.content}</div>
                      <div className="message-time">{item.create_time}</div>
                    </div>
                    {item.sender_id === chatData.user_id && (
                      <Avatar src={require('../../../static/img/5.jpg')} />
                    )}
                  </div>
                </List.Item>
              )}
            />
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <div className="input-tools">
              <SmileOutlined />
              <PaperClipOutlined />
              <AudioOutlined />
            </div>
            <div className="inputBox">
              <TextArea
                className="inputIN"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="输入消息"
                autoSize={{ minRows: 3, maxRows: 6 }}
                onPressEnter={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                  //回车键后一直聚焦
                  (e.target as HTMLTextAreaElement).focus();
                }}
              />
              <Button
                type="primary"
                onClick={handleSendMessage}
                loading={isLoadingHistory}
                icon={<SendOutlined />}
                style={{ marginTop: 8 }}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="noChatData">
          <Empty description="请选择聊天" />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
