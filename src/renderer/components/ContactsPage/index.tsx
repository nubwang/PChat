import React, { useState, useEffect, useCallback } from 'react';
import type { CollapseProps } from 'antd';
import { Layout, Tabs, Input, List, Avatar, Button, Collapse, message } from 'antd';
import {
  SearchOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './style.css';
import { api } from '../../../static/api';
import { useSocket } from '../../store/useSocket';
import ContactDetailPage from '../ContactDetailPage';

const { Content, Header } = Layout;
const { Search } = Input;

const groupsData = [
  {
    name: '项目讨论组1',
    avatar: require('../../../static/img/1.jpg'),
    description: '5人',
  },
  {
    name: '同学群',
    avatar: require('../../../static/img/2.jpg'),
    description: '30人',
  },
];

const ContactsPage: React.FC = () => {
  const [friendsPending, setFriendsPending] = useState([]);
  const [friendAccepted, setFriendAccepted] = useState([]);
  const [contactData, setContactData] = useState(null);
  const navigate = useNavigate();
  const { sendMessage, subscribe, unsubscribe } = useSocket();

  // 用 useCallback 包裹，避免每次渲染都新建函数
  const getPendingFriend = useCallback(() => {
    const data = localStorage.getItem("userData")
      ? JSON.parse(localStorage.getItem("userData"))
      : localStorage.getItem("userData");
    sendMessage("init", { userId: data.id });
  }, [sendMessage]);

  // 只订阅一次，并在卸载时取消订阅
  useEffect(() => {
    const handleInit = (data) => {
      if (data.code === 200) {
        console.log(data.data,window.electronChat.db,'data.data.friendAccepted')
        if(data.data.friendPending && data.data.friendPending.length > 0){
          data.data.friendPending.forEach((item,index)=>{
            window.electronChat.db.saveFriend(item.id, item.head_img,item.username, "pending");
          });
        }
        if(data.data.friendAccepted && data.data.friendAccepted.length > 0){
          data.data.friendAccepted.forEach((item,index)=>{
            window.electronChat.db.saveFriend(item.id, item.head_img,item.username, "accepted");
          });
        }
        window.electronChat.db.getFriendByUserId(6).then((data) => {
          console.log(data, '获取好友列表');
        });
        setFriendsPending(data.data.friendPending);
        setFriendAccepted(data.data.friendAccepted);
      } else {
        message.error(data.message);
      }
    };

    getPendingFriend();
    subscribe("init", handleInit);

    return () => {
      unsubscribe("init");
    };
  }, [subscribe, unsubscribe, getPendingFriend]);

  const onChange = useCallback(() => {}, []);

  const itemOnClick = useCallback((data) => {
    setContactData(data);
  }, []);

  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: '新朋友',
      children: (
        <List
          itemLayout="horizontal"
          dataSource={friendsPending}
          renderItem={(item) => (
            <List.Item className="contact-item">
              <List.Item.Meta
                avatar={<Avatar src={item.head_img} />}
                title={<span>{item.username}</span>}
                description={item?.notes?.[0]?.leaveMessage}
                onClick={() => itemOnClick({ data: item, type: 'pending' })}
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: '2',
      label: '联系人',
      children: (
        <List
          itemLayout="horizontal"
          dataSource={friendAccepted}
          renderItem={(item) => (
            <List.Item className="contact-item">
              <List.Item.Meta
                avatar={<Avatar src={item.head_img} />}
                title={<span>{item.username}</span>}
                onClick={() => itemOnClick({ data: item, type: 'accepted' })}
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: '3',
      label: '群聊',
      children: (
        <List
          itemLayout="horizontal"
          dataSource={groupsData}
          renderItem={(item) => (
            <List.Item className="contact-item">
              <List.Item.Meta
                avatar={<Avatar src={item.avatar} />}
                title={<span>{item.name}</span>}
                description={item.description}
                onClick={() => itemOnClick(item)}
              />
            </List.Item>
          )}
        />
      ),
    },
  ];

  return (
    <div className="slef-container">
      <div className="ContactsPage">
        <Header className="contacts-header">
          <Search
            placeholder="搜索"
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: '100%' }}
          />
          <Button
            type="default"
            color="#bbb"
            style={{ backgroundColor: "#f5f5f5", borderColor: '#f5f5f5' }}
            icon={<UnorderedListOutlined />}
          />
        </Header>
        <Content className="contacts-content">
          <Collapse items={items} defaultActiveKey={['2','3']} onChange={onChange} />
        </Content>
      </div>
      <ContactDetailPage contactData={contactData} />
    </div>
  );
};

export default ContactsPage;
