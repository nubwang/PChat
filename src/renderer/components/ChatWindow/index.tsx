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
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const ChatWindow: React.FC<{ chatData?: ChatData }> = ({ chatData }) => {
  // 状态管理
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Socket 连接
  const { sendMessage, subscribe } = useSocket();

  // 加载历史消息（优化版）
  const loadHistoryMessages = useCallback(async () => {
    // if (!hasMore || isLoadingHistory || !chatData) return;
    setIsLoadingHistory(true);

    const container = messageContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;
    const prevScrollTop = container?.scrollTop || 0;

    try {
      const params = {
        conversationId: chatData.conversation_id,
        pageSize: 100,
        page: page,
      };
      console.log(params, 'loadHistoryMessages params');
      sendMessage('getConversationMessages', params);

      // 临时记录当前第一条消息的 ID 或位置（如果需要更精确的控制）
    } catch (error) {
      message.error('加载历史消息失败');
    }
  }, [chatData, hasMore, isLoadingHistory, page,messages]);

  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (data.code === 200) {
        let newData = data.messages;
        if(newData&&newData.length>0){
          setPage(p => p + 1);
          let newData2 = [...newData].reverse();
          setMessages(prev => [...newData2, ...prev]);
          const container = messageContainerRef.current;
          const prevScrollHeight = container?.scrollHeight || 0;
          requestAnimationFrame(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              // 保持视图不变：新增内容的高度 = 新总高度 - 旧总高度
              const deltaHeight = newScrollHeight - prevScrollHeight;
              // 手动调整滚动位置（向下移动新增内容的高度）
              container.scrollTop = deltaHeight;
            }
          });
          if(newData&&newData.length < 100){
            setIsLoadingHistory(false);
          }
        }else{
          setIsLoadingHistory(false);
        }
      } else {
        setIsLoadingHistory(false);
        message.error('获取消息失败');
      }

    };
    let unsubscribe = subscribe('conversationMessages', handleNewMessage);
    return () => unsubscribe?.();
  }, [subscribe, chatData]);

  // 滚动处理（优化版）
  const handleScroll = useCallback(
  debounce(() => {
    if (messageContainerRef.current?.scrollTop === 0) {
      loadHistoryMessages();
    }
  }, 200),
  [hasMore, isLoadingHistory, loadHistoryMessages]
);

  useEffect(() => {
    if(page === 0){
      loadHistoryMessages();
    }
  }, [page,messages]);

  // 消息订阅（优化内存管理）
  useEffect(() => {
    if (!chatData) return;

    // 初始化加载历史消息
    //根据chatData变化，重置消息列表
    setMessages([]);
    setPage(0);
    setHasMore(true);
    setIsLoadingHistory(false);
    // setUserData(null);
    let userData = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData")):localStorage.getItem("userData");
    setUserData(userData);

    const handleNewMessage = (data: any) => {
      if (data.code === 200) {
        let newData = data.data;
        newData.sender_avatar = userData.avatar;
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
  }, [chatData]);

  // 发送消息（优化参数处理）
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || !chatData) return;
    let data = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData")):localStorage.getItem("userData");

    const params = {
      conversation_id: chatData.conversation_id,
      sender_id: data.id,
      receiver_type: chatData.peer_type,
      receiver_id: chatData.peer_id === data.id?chatData.user_id:chatData.peer_id,
      content_type: 'text',
      content: inputValue.trim(),
    };

    sendMessage('sendMessage', params);
    setInputValue('');

  }, [inputValue, chatData, sendMessage]);

  useEffect(() => {
    if (messageContainerRef.current?.scrollTop !== 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages,chatData]);

  return (
    <div className="chat-window">
      {chatData ? (
        <>
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-title">{chatData.username}</span>
            </div>
          </div>

          <div className="message-container" onScroll={handleScroll} ref={messageContainerRef}>
            <List
              // loading={isLoadingHistory}
              header={
                <div style={{ textAlign: 'center', padding: 10 }}>
                  {isLoadingHistory ? <Spin size="small" /> : ''}
                </div>
              }
              dataSource={messages}
              split={false}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <div className={`message-item ${
                    item.sender_id === userData.id ? 'sent' : 'received'
                  }`}>
                    {item.sender_id !== userData.id && (
                      <Avatar src={item.sender_avatar} />
                    )}
                    <div className="message-content">
                      <div className="message-text">{item.content}</div>
                      <div className="message-time">{item.create_time}</div>
                    </div>
                    {item.sender_id === userData.id && (
                      <Avatar src={item.sender_avatar?item.sender_avatar:userData.avatar} />
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
              {/* <Button
                type="primary"
                onClick={handleSendMessage}
                loading={isLoadingHistory}
                icon={<SendOutlined />}
                style={{ marginTop: 8 }}
              /> */}
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
