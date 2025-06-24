import React, { useState } from 'react';
import { Avatar, Input, Button, message } from 'antd';
import {
  SmileOutlined,
  PaperClipOutlined,
  AudioOutlined,
  SendOutlined,
} from '@ant-design/icons';
import './style.css';

const { TextArea } = Input;

const ChatWindow: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <Avatar src="https://randomuser.me/api/portraits/men/1.jpg" />
          <span className="chat-title">张三</span>
        </div>
      </div>
      <div className="message-container">
        {/* 这里放置消息列表 */}
        <div className="message-item received">
          <Avatar src="https://randomuser.me/api/portraits/men/1.jpg" />
          <div className="message-content">
            <div className="message-text">你好，最近怎么样？</div>
            <div className="message-time">10:30</div>
          </div>
        </div>
        <div className="message-item sent">
          <div className="message-content">
            <div className="message-text">我很好，谢谢！</div>
            <div className="message-time">10:32</div>
          </div>
          <Avatar src="https://randomuser.me/api/portraits/women/44.jpg" />
        </div>
      </div>
      <div className="input-area">
        <div className="input-tools">
          <SmileOutlined />
          <PaperClipOutlined />
          <AudioOutlined />
        </div>
        <div className='inputBox'>
          <TextArea
            className='inputIN'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入消息"
            autoSize={{ minRows: 3, maxRows: 6 }}
            onPressEnter={(e) => {
              console.log("enter")
              e.preventDefault();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
