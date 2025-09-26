import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, Input, Button, message, Empty, List, Spin, Drawer } from 'antd';
import {
  SmileOutlined,
  PaperClipOutlined,
  AudioOutlined,
  SendOutlined,
  EllipsisOutlined
} from '@ant-design/icons';
import './style.css';
import { useSocket } from '../../store/useSocket';
import DrawerGroup from './DrawerGroup';
import { on } from 'events';

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
  const [page, setPage] = useState(-1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [onoff, setOnoff] = useState(true);
  const [conversationId, setConversationId] = useState(chatData?.conversation_id || '');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Socket 连接
  const { sendMessage, subscribe } = useSocket();

  // 消息订阅（优化内存管理）
  useEffect(() => {
    console.log(chatData,'chatData')
    setMessages([]);
    setPage(0);
    setIsLoadingHistory(true);
    setOpen(false);
    // messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    let userData = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")) : localStorage.getItem("userData");
    setUserData(userData);

    const handleNewMessage = (data: any) => {
      console.log(data, 'newMessage');
      if (data.code === 200) {
        let newData = data.data;
        newData.sender_avatar = userData.avatar;
        setMessages(prev => [...prev, newData]);
      } else {
        message.error('获取消息失败');
      }
    };

    let unsubscribe = subscribe('newMessage', handleNewMessage);
    return () => unsubscribe?.();
  }, [chatData, subscribe]);

  // 初始化用户信息
  useEffect(() => {
    if (page === 0) {
      loadHistoryMessages();
    }
  }, [page, chatData]);

  // 加载历史消息（优化版）
  const loadHistoryMessages = useCallback(async () => {
    if (!isLoadingHistory) return;

    try {
      const params = {
        conversationId: chatData?.conversation_id,
        pageSize: 100,
        page: page,
      };
      if (params.conversationId) {
        sendMessage('getConversationMessages', params);
      }
    } catch (error) {
      // message.error('加载历史消息失败');
    }
  }, [chatData, isLoadingHistory, page, sendMessage]);

  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (data.code === 200) {
        let newData = data.messages;
        if (newData && newData.length > 0) {
          setPage(p => p + 1);
          //newData长度小于一百需要去重，大于一百说明还有下一页，不需要去重
          let newData2 = [...newData].reverse();
          if(newData.length <= 100){
            setMessages(prev => [...new Map([...newData2, ...prev].map(u => [u.msg_id, u])).values()]);
          }else{
            setMessages(prev => [...newData2, ...prev]);
          }

          const container = messageContainerRef.current;
          const prevScrollHeight = container?.scrollHeight || 0;
          requestAnimationFrame(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              const deltaHeight = newScrollHeight - prevScrollHeight;
              container.scrollTop = deltaHeight;
            }
          });
          if (newData && newData.length < 100) {
            setIsLoadingHistory(false);
          }
        } else {
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
    [loadHistoryMessages]
  );

  // 发送消息（优化参数处理）
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || !chatData) return;
    let data = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")) : localStorage.getItem("userData");

    const params = {
      conversation_id: chatData.conversation_id,
      sender_id: data.id,
      receiver_type: chatData.peer_type,
      receiver_id: chatData.peer_id === data.id ? chatData.user_id : chatData.peer_id,
      content_type: 'text',
      content: inputValue.trim(),
    };

    sendMessage('sendMessage', params);
    setInputValue('');
  }, [inputValue, chatData, sendMessage]);

  useEffect(() => {
    if (messageContainerRef.current?.scrollTop !== 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);
  useEffect(() => {
    console.log(1, 'messages changed');
    const observer = new MutationObserver(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    });
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      observer.observe(container, { childList: true, subtree: true });
    }
    return () => observer.disconnect();
  }, [chatData]);


  const showDrawer = () => {
    //利用onoff控制第二次点击关闭抽屉
    setOnoff(onoff => !onoff);
    setOpen(onoff);
  };
  const onClose = () => {
    setOpen(false);
  };

  return (
    <div className="chat-window">
      {chatData ? (
        <div className="chat-container">
          {/* 合并的头部区域 */}
          <div className="chat-header">
            <span className="chat-title">{chatData.username}</span>
            <Button onClick={showDrawer}>
              <EllipsisOutlined style={{ fontSize: '24px', color: '#000' }} />
            </Button>
          </div>

          {/* 消息容器和输入区域 */}
          <div className="chat-content">
            <DrawerGroup open={open} onClose={onClose} />
            <div className="message-container" onScroll={handleScroll} ref={messageContainerRef}>
              <List
                header={
                  <div style={{ textAlign: 'center', padding: 10 }}>
                    {isLoadingHistory ? <Spin size="small" /> : ''}
                  </div>
                }
                dataSource={messages}
                split={false}
                renderItem={(item) => {
                  let friend = chatData.user_id === userData.id ? chatData.peer_id : chatData.user_id;
                  if(item.sender_id == friend || item.receiver_id == friend){
                    return (
                      <List.Item key={item.id}>
                        <div className={`message-item ${
                          item.sender_id === userData?.id ? 'sent' : 'received'
                        }`}>
                          {item.sender_id !== userData?.id && (
                            <Avatar src={item.sender_avatar} />
                          )}
                          <div className="message-content">
                            <div className="message-text">{item.content}</div>
                            <div className="message-time">{item.create_time}</div>
                          </div>
                          {item.sender_id === userData?.id && (
                            <Avatar src={item.sender_avatar} />
                          )}
                        </div>
                      </List.Item>
                    )
                  }else{
                    return null;
                  }
                }}
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
                    (e.target as HTMLTextAreaElement).focus();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="noChatData">
          <Empty description="请选择聊天" />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
