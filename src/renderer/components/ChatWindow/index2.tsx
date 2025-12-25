import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, Input, Button, message, Empty, List, Spin, Drawer, Image } from 'antd';
import {
  SmileOutlined,
  PaperClipOutlined,
  AudioOutlined,
  SendOutlined,
  EllipsisOutlined,
  CloseOutlined
} from '@ant-design/icons';
import './style.css';
import { useSocket } from '../../store/useSocket';
import DrawerGroup from './DrawerGroup';
import { useDispatch } from 'react-redux';
import { messagesData } from '../../store/routerSlice';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const { TextArea } = Input;

// 类型定义
interface Message {
  id: string | number;
  content: string;
  create_time: string;
  timestamp: string;
  sender_id: string | number;
  sender_avatar: string;
  content_type: string;
  receiver_id: string | number;
  receiver_type: string;
  sender_name?: string;
}

interface ChatData {
  conversation_id: string;
  user_id: string;
  peer_type: string;
  peer_id: string;
  username?: string;
}

interface FilePreview {
  id: string;
  file: File;
  url: string;
  type: string;
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

// 智能时间格式化函数
const formatMessageTime = (timestamp: string, prevTimestamp?: string): string => {
  if (!timestamp) return '';
  
  const current = new Date(timestamp);
  const now = new Date();
  const prev = prevTimestamp ? new Date(prevTimestamp) : null;
  
  // 如果和上一条消息在同一分钟内，不显示时间
  if (prev && Math.abs(current.getTime() - prev.getTime()) < 60000) {
    return '';
  }
  
  const isToday = current.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === current.toDateString();
  const isThisYear = current.getFullYear() === now.getFullYear();
  
  if (isToday) {
    // 今天：显示时间
    return current.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } else if (isYesterday) {
    // 昨天：显示 昨天 + 时间
    return `昨天 ${current.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}`;
  } else if (isThisYear) {
    // 今年：显示 月-日 + 时间
    return `${current.getMonth() + 1}-${current.getDate()} ${current.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}`;
  } else {
    // 跨年：显示 年-月-日 + 时间
    return `${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()} ${current.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}`;
  }
};

// 检查是否需要显示时间分隔符（5分钟间隔）
const shouldShowTimeDivider = (currentTime: string, prevTime?: string): boolean => {
  if (!prevTime) return true;
  
  const current = new Date(currentTime);
  const prev = new Date(prevTime);
  const diffInMinutes = (current.getTime() - prev.getTime()) / (1000 * 60);
  
  return diffInMinutes >= 5;
};

const ChatWindow: React.FC<{ chatData?: ChatData }> = ({ chatData }) => {
  // 状态管理
  const dispatch = useDispatch();
  const [inputValue, setInputValue] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(-1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { messages } = useSelector((state: RootState) => state.router);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const currentChatIdRef = useRef<string>('');
  const scrollLockRef = useRef(false);

  // Socket 连接
  const { sendMessage, subscribe } = useSocket();

  useEffect(() => {
    if (!chatData) return;

    console.log(chatData, 'chatData__________初始化聊天');
    
    // 重置状态
    setPage(0);
    setIsLoadingHistory(true);
    setHasMore(true);
    setOpen(false);
    isSendingRef.current = false;
    isLoadingRef.current = false;
    scrollLockRef.current = false;
    
    // 更新当前聊天ID引用
    currentChatIdRef.current = chatData.conversation_id;

    const userData = localStorage.getItem("userData") 
      ? JSON.parse(localStorage.getItem("userData")!) 
      : null;
    setUserData(userData);

    if(chatData?.peer_type === "group") {
      sendMessage('get_group_members', {groupId: chatData?.peer_id});
    }

    // 初始加载消息
    loadInitialMessages();
  }, [chatData]);

  const loadInitialMessages = useCallback(() => {
    if (!chatData?.conversation_id || isLoadingRef.current) return;

    isLoadingRef.current = true;
    scrollLockRef.current = true;
    const params = {
      conversationId: chatData.conversation_id,
      pageSize: 20,
      page: 0,
    };
    
    sendMessage('getConversationMessages', params);
  }, [chatData, sendMessage]);

  // 消息订阅处理
  useEffect(() => {
    console.log('设置新消息订阅处理');
    const handleNewMessage = (data: any) => {
      if (data.code === 200) {
        const newData = data.data;
        const userData = localStorage.getItem("userData") 
        ? JSON.parse(localStorage.getItem("userData")!) 
        : null;
        sendMessage('get_conversation_info', {conversationId: newData.conversation_id, userId: userData.id});
        console.log('收到新消息:', newData);
        
        dispatch(messagesData({ 
          conversationId: newData.conversation_id, 
          messages: [newData] 
        }));

        isSendingRef.current = false;
      } else {
        message.error('发送消息失败');
        isSendingRef.current = false;
      }
    };

    const unsubscribe = subscribe('newMessage', handleNewMessage);
    return () => unsubscribe?.();
  }, [subscribe, dispatch, chatData]);

  const loadMoreMessages = useCallback(() => {
    if (!chatData?.conversation_id || !hasMore || isLoadingRef.current || isSendingRef.current) return;
    isLoadingRef.current = true;
    const params = {
      conversationId: chatData.conversation_id,
      pageSize: 20,
      page: page,
    };
    
    console.log('加载更多历史消息中...',params);
    sendMessage('getConversationMessages', params);
  }, [chatData, page, hasMore, sendMessage]);

  useEffect(() => {
    const handleConversationMessages = (data: any) => {
      if (data.code === 200) {
        const newData = data.messages;
        console.log('历史消息数据:', page, data);

        if (newData && newData.length > 0) {
          if (page === 0) {
            dispatch(messagesData({ 
              conversationId: chatData!.conversation_id, 
              messages: newData,
              isHistory: true
            }));
            setPage(1);
            
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
              scrollLockRef.current = false;
            }, 200);
          } else {
            dispatch(messagesData({ 
              conversationId: chatData!.conversation_id, 
              messages: newData,
              isHistory: true
            }));
            setPage(prev => prev + 1);

            const container = messageContainerRef.current;
            const prevScrollHeight = container?.scrollHeight || 0;
            requestAnimationFrame(() => {
              if (container) {
                const newScrollHeight = container.scrollHeight;
                const deltaHeight = newScrollHeight - prevScrollHeight;
                container.scrollTop = deltaHeight;
              }
            });
          }

          if (newData.length < 20) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } else {
        message.error('获取历史消息失败');
      }
      
      setIsLoadingHistory(false);
      isLoadingRef.current = false;
    };

    const unsubscribe = subscribe('conversationMessages', handleConversationMessages);
    return () => unsubscribe?.();
  }, [subscribe, chatData, page]);

  // 滚动处理
  const handleScroll = useCallback(
    debounce(() => {
      if (scrollLockRef.current) return;
      
      const container = messageContainerRef.current;
      if (!container || isLoadingRef.current || isSendingRef.current) return;
      
      const scrollTop = container.scrollTop;
      if (scrollTop === 0 && hasMore) {
        console.log('加载更多历史消息');
        loadMoreMessages();
      }
    }, 200),
    [loadMoreMessages, hasMore]
  );

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current && !scrollLockRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatData]);

  // 文件处理函数
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: FilePreview[] = [];
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const id = Math.random().toString(36).substr(2, 9);
        const url = URL.createObjectURL(file);
        newFiles.push({
          id,
          file,
          url,
          type: 'image'
        });
      } else {
        message.warning(`不支持的文件类型: ${file.type}`);
      }
    });

    setFilePreviews(prev => [...prev, ...newFiles]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (e.target) {
      e.target.value = '';
    }
  };

  const removePreviewFile = (id: string) => {
    setFilePreviews(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleSendMessage = useCallback(() => {
    if ((!inputValue.trim() && filePreviews.length === 0) || !chatData) return;
    
    const data = localStorage.getItem("userData") 
      ? JSON.parse(localStorage.getItem("userData")!) 
      : null;

    // 发送文件
    if (filePreviews.length > 0) {
      filePreviews.forEach(filePreview => {
        const formData = {
          file: filePreview.file,
          conversation_id: chatData.conversation_id,
          sender_id: data.id,
          sender_avatar: data.avatar,
          sender_name: data.username,
          receiver_type: chatData.peer_type,
          receiver_id: chatData.peer_id === data.id ? chatData.user_id : chatData.peer_id,
          content_type: 'image',
          content: filePreview.file.name
        };
        
        sendMessage('sendMessage', formData);
      });
    }

    // 发送文字消息
    if (inputValue.trim()) {
      const params = {
        conversation_id: chatData.conversation_id,
        sender_id: data.id,
        sender_avatar: data.avatar,
        sender_name: data.username,
        receiver_type: chatData.peer_type,
        receiver_id: chatData.peer_id === data.id ? chatData.user_id : chatData.peer_id,
        content_type: 'text',
        content: inputValue.trim(),
      };

      sendMessage('sendMessage', params);
    }

    setInputValue('');
    setFilePreviews([]);
  }, [inputValue, chatData, sendMessage, filePreviews]);

  // 拖拽事件处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const showDrawer = () => {
    setOpen(open => !open);
  };
  
  const onClose = () => {
    setOpen(false);
  };

  // 渲染消息列表
  const renderMessageList = () => {
    if (!chatData || !messages[chatData.conversation_id]) return null;

    const currentMessages = messages[chatData.conversation_id] || [];
    const userData = localStorage.getItem("userData") 
      ? JSON.parse(localStorage.getItem("userData")!) 
      : null;

    return currentMessages.map((item: Message, index: number) => {
      const prevMessage = index > 0 ? currentMessages[index - 1] : null;
      const showTime = shouldShowTimeDivider(item.timestamp, prevMessage?.timestamp);
      const formattedTime = formatMessageTime(item.timestamp, prevMessage?.timestamp);

      // 判断消息类型和归属
      const isGroupMessage = item.receiver_type === 'group';
      const isOwnMessage = item.sender_id === userData?.id;

      if (isGroupMessage) {
        // 群聊消息
        return (
          <div key={item.id} className="message-item-wrapper">
            {showTime && formattedTime && (
              <div className="message-time-divider">
                <span>{formattedTime}</span>
              </div>
            )}
            <div className={`message-item ${isOwnMessage ? 'sent' : 'received'}`}>
              {!isOwnMessage && (
                <Avatar shape="circle" src={item.sender_avatar} />
              )}
              <div className="message-content">
                {!isOwnMessage && (
                  <div className="sender-name">{item.sender_name}</div>
                )}
                <div className="message-bubble">
                  {item.content_type === 'image' ? (
                    <Image 
                      width={200} 
                      src={item.content} 
                      placeholder={
                        <div className="image-placeholder">图片加载中...</div>
                      }
                    />
                  ) : (
                    <div className="message-text">{item.content}</div>
                  )}
                </div>
              </div>
              {isOwnMessage && (
                <Avatar shape="circle" src={userData.avatar} />
              )}
            </div>
          </div>
        );
      } else {
        // 私聊消息
        return (
          <div key={item.id} className="message-item-wrapper">
            {showTime && formattedTime && (
              <div className="message-time-divider">
                <span>{formattedTime}</span>
              </div>
            )}
            <div className={`message-item ${isOwnMessage ? 'sent' : 'received'}`}>
              {!isOwnMessage && (
                <Avatar shape="circle" src={item.sender_avatar} />
              )}
              <div className="message-content">
                <div className="message-bubble">
                  {item.content_type === 'image' ? (
                    <Image 
                      width={200} 
                      src={item.content} 
                      placeholder={
                        <div className="image-placeholder">图片加载中...</div>
                      }
                    />
                  ) : (
                    <div className="message-text">{item.content}</div>
                  )}
                </div>
              </div>
              {isOwnMessage && (
                <Avatar shape="circle" src={userData.avatar} />
              )}
            </div>
          </div>
        );
      }
    });
  };

  return (
    <div className="chat-window custom-title-bar-no">
      {chatData ? (
        <div className="chat-container custom-title-bar-no">
          {/* 头部区域 */}
          <div className="chat-header custom-title-bar">
            <span className="chat-title">{chatData.username}</span>
            <Button onClick={showDrawer}>
              <EllipsisOutlined />
            </Button>
          </div>

          {/* 消息容器和输入区域 */}
          <div className="chat-content">
            <DrawerGroup open={open} onClose={onClose} chatData={chatData} />
            
            {/* 消息列表容器 */}
            <div 
              className="message-container scrollbar-hidden" 
              onScroll={handleScroll} 
              ref={messageContainerRef}
            >
              {/* 加载更多指示器 */}
              {hasMore && (
                <div className="load-more-indicator">
                  <Spin size="small" />
                  <span>加载中...</span>
                </div>
              )}
              
              {/* 消息列表 */}
              {renderMessageList()}
              
              {/* 滚动锚点 */}
              <div ref={messagesEndRef} />
            </div>

            {/* 文件预览区域 */}
            {filePreviews.length > 0 && (
              <div className="file-previews">
                {filePreviews.map(file => (
                  <div key={file.id} className="file-preview-item">
                    <Image
                      width={60}
                      height={60}
                      src={file.url}
                      alt="预览"
                      style={{ objectFit: 'cover' }}
                      preview={{
                        mask: null
                      }}
                    />
                    <Button
                      type="text"
                      icon={<CloseOutlined />}
                      className="remove-file-btn"
                      onClick={() => removePreviewFile(file.id)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 输入区域 */}
            <div 
              className={`input-area ${isDragging ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              ref={dropZoneRef}
            >
              <div className="input-tools">
                <SmileOutlined />
                <PaperClipOutlined onClick={handleAttachmentClick} />
                <AudioOutlined />
              </div>
              <div className="inputBox">
                <TextArea
                  className="inputIN"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="输入消息，或拖拽图片到此区域"
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  type="primary" 
                  icon={<SendOutlined />} 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() && filePreviews.length === 0}
                  className="send-btn"
                >
                  发送
                </Button>
              </div>
            </div>
          </div>

          {/* 隐藏的文件输入 */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
          />
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