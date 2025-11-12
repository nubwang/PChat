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

const ChatWindow: React.FC<{ chatData?: ChatData }> = ({ chatData }) => {
  // 状态管理
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(-1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState(chatData?.conversation_id || '');
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Socket 连接
  const { sendMessage, subscribe } = useSocket();

  // 消息订阅（优化内存管理）
  useEffect(() => {
    setMessages([]);
    setPage(0);
    setIsLoadingHistory(true);
    setOpen(false);
    // messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    let userData = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")) : localStorage.getItem("userData");
    setUserData(userData);
    if(chatData?.peer_type === "group") sendMessage('get_group_members', {groupId: chatData?.peer_id});

    const handleNewMessage = (data: any) => {
      if (data.code === 200) {
        let newData = data.data;
        sendMessage('get_conversation_info', {conversationId: newData.conversation_id, userId: userData.id});
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
  }, [page, chatData, isLoadingHistory]);

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
  }, [subscribe, chatData, isLoadingHistory]);

  // 滚动处理（优化版）
  const handleScroll = useCallback(
    debounce(() => {
      if (messageContainerRef.current?.scrollTop === 0) {
        loadHistoryMessages();
      }
    }, 200),
    [loadHistoryMessages]
  );

  // 处理文件选择
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: FilePreview[] = [];
    
    Array.from(files).forEach(file => {
      // 检查文件类型
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

  // 处理文件输入变化
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // 重置input，允许选择相同文件
    if (e.target) {
      e.target.value = '';
    }
  };

  // 移除预览文件
  const removePreviewFile = (id: string) => {
    setFilePreviews(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  // 发送消息（支持文字和图片）
  const handleSendMessage = useCallback(() => {
    if ((!inputValue.trim() && filePreviews.length === 0) || !chatData) return;
    
    let data = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")) : localStorage.getItem("userData");

    // 如果有文件，先发送文件
    if (filePreviews.length > 0) {
      filePreviews.forEach(filePreview => {
        // 这里需要根据你的后端API调整文件上传逻辑
        const formData = new FormData();
        formData.append('file', filePreview.file);
        formData.append('conversation_id', chatData.conversation_id);
        formData.append('sender_id', data.id);
        formData.append('sender_avatar', data.avatar);
        formData.append('sender_name', data.username);
        formData.append('receiver_type', chatData.peer_type);
        formData.append('receiver_id', chatData.peer_id === data.id ? chatData.user_id : chatData.peer_id);
        formData.append('content_type', 'image');
        
        // 调用文件上传API
        sendMessage('uploadFile', formData);
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

    // 清空输入和预览
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

  // 点击附件按钮
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (messageContainerRef.current?.scrollTop !== 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);
  
  useEffect(() => {
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
    setOpen(open => !open);
  };
  
  const onClose = () => {
    setOpen(false);
  };

  return (
    <div className="chat-window custom-title-bar-no">
      {chatData ? (
        <div className="chat-container custom-title-bar-no">
          {/* 合并的头部区域 */}
          <div className="chat-header custom-title-bar">
            <span className="chat-title">{chatData.username}</span>
            <Button onClick={showDrawer}>
              <EllipsisOutlined className='custom-title-bar-no' style={{ fontSize: '24px', color: '#000' }} />
            </Button>
          </div>

          {/* 消息容器和输入区域 */}
          <div className="chat-content">
            <DrawerGroup open={open} onClose={onClose} chatData={chatData} />
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
                  let friend = chatData.user_id == userData.id ? chatData.peer_id : chatData.user_id;
                  if(((item.sender_id == friend && item.receiver_id == userData.id) || (item.receiver_id == friend && item.sender_id == userData.id))&& item.receiver_type == chatData.peer_type){
                    return (
                      <List.Item key={item.id}>
                        <div className={`message-item ${
                          item.sender_id === userData?.id ? 'sent' : 'received'
                        }`}>
                          {item.sender_id !== userData?.id && (
                            <Avatar shape="circle" src={item.sender_avatar} />
                          )}
                          <div className="message-content">
                            <div className="message-text">{item.content}</div>
                            <div className="message-time">{item.create_time}</div>
                          </div>
                          {item.sender_id === userData?.id && (
                            <Avatar shape="circle" src={userData.avatar} />
                          )}
                        </div>
                      </List.Item>
                    )
                  }else if(item.receiver_id == chatData.peer_id && item.receiver_type == chatData.peer_type){
                    return (
                      <List.Item key={item.id}>
                        <div className={`message-item ${
                          item.sender_id === userData?.id ? 'sent' : 'received'
                        }`}>
                          {item.sender_id !== userData?.id && (
                            <Avatar shape="circle" src={item.sender_avatar} />
                          )}
                          <div className="message-content">
                            <div className="message-text">{item.content}</div>
                            <div className="message-time">{item.create_time}</div>
                          </div>
                          {item.sender_id === userData?.id && (
                            <Avatar shape="circle" src={userData.avatar} />
                          )}
                        </div>
                      </List.Item>
                    )
                  }
                }}
              />
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
                      style={{ objectFit: 'cover', borderRadius: 4 }}
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

            <div 
              className={`input-area ${isDragging ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              ref={dropZoneRef}
            >
              <div className="input-tools">
                <SmileOutlined />
                <PaperClipOutlined onClick={handleAttachmentClick} style={{ cursor: 'pointer' }} />
                <AudioOutlined />
              </div>
              <div className="inputBox">
                <TextArea
                  className="inputIN"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="输入消息，或拖拽图片到此区域"
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>
              {/* <div className="send-button-container">
                <Button 
                  type="primary" 
                  icon={<SendOutlined />} 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() && filePreviews.length === 0}
                >
                  发送
                </Button>
              </div> */}
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