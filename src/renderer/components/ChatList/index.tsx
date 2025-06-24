import React, { useState } from 'react';
import { Input, List, Avatar, Button, Modal } from 'antd';
import { SearchOutlined,UserAddOutlined } from '@ant-design/icons';
import './style.css';

const { Search } = Input;

const chatData = [
  {
    title: '张三',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    lastMessage: '你好，最近怎么样？',
    time: '10:30',
    unread: 2,
  },
  {
    title: '李四',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    lastMessage: '项目进展如何？',
    time: '昨天',
    unread: 0,
  },
  {
    title: '王二麻子',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    lastMessage: '啦啦啦',
    time: '前天',
    unread: 10,
  },
  // 更多聊天...
];


const ChatList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  return (
    <div className="chat-list-container">
      <div className="search-bar">
        <Search
          placeholder="搜索"
          allowClear
          prefix={<SearchOutlined />}
          style={{ width: '100%' }}
        />
        <Button type="default" color={"#bbb"} style={{backgroundColor: "#f5f5f5",borderColor: '#f5f5f5'}} icon={<UserAddOutlined />} onClick={showModal}></Button>
      </div>
      <Modal
        title="Basic Modal"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Modal>
      <List
        itemLayout="horizontal"
        dataSource={chatData}
        renderItem={(item) => (
          <List.Item className="chat-item">
            <List.Item.Meta
              avatar={<Avatar src={item.avatar} />}
              title={<span>{item.title}</span>}
              description={item.lastMessage}
            />
            <div className="chat-item-right">
              <span className="time">{item.time}</span>
              {item.unread > 0 && (
                <span className="unread-badge">{item.unread}</span>
              )}
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};

export default ChatList;
