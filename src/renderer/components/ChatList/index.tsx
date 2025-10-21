import React, { useState,useEffect, useMemo, useCallback,useRef } from 'react';
import { Input, List, Avatar, Button, Modal,Search, Divider, Typography, Empty, message, Dropdown } from 'antd';
import { SearchOutlined,UserAddOutlined,UnorderedListOutlined,UserOutlined,FileAddOutlined } from '@ant-design/icons';
import './style.css';
import ChatWindow from '../ChatWindow';
import { api } from "../../../static/api";
import { useNavigate,useLocation } from 'react-router-dom';
import { useSocket } from '../../store/useSocket';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { formatChatTime } from '../../../utils/timeConversion';
import { useDispatch } from 'react-redux';
import { changeContersionId } from '../../store/routerSlice';
import type { MenuProps } from 'antd';
import AddFriend from "./addFriend";
import AddGroup from "./addGroup";

const { Search,TextArea } = Input;


const ChatList: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);


  const [contact,setContact] = useState({});
  const [infoItems,setInfoItems] = useState([]);

  const [slefInfo,setSlefInfo] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();


  const navigate = useNavigate();
  const { sendMessage,subscribe,connectSocket,sendWithReconnect } = useSocket();
  const [chatData, setChatData] = useState([]);
  const [chatWindowData, setChatWindowData] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const { Conversation } = location.state || {};
  const { isConnected } = useSelector( (state: RootState) => state.socket );
  const { contersionId } = useSelector( (state: RootState) => state.router );
  const groupRef = useRef<{ openModal: () => void; closeModal: () => void }>(null);
  // 修改后的 useEffect 逻辑
  useEffect(() => {
    console.log(isConnected,'isConnected')
    if (isConnected) {
      setTimeout(()=>{
        init();
      },500)
    }
  }, [isConnected,sendMessage]); // 仅依赖 Conversation

  const onConfirm = useCallback((selectedUsers) => {
    console.log('创建群聊', selectedUsers);
      let data = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData")):localStorage.getItem("userData");
      let groupData = {
        creatorId: data.id,
        memberIds: selectedUsers,
      }
      // return false;
      sendWithReconnect("createGroup", groupData, (response) => {
        console.log('createGroup response:', response);
        if(response.code === 200){
          messageApi.success('群聊创建成功');
          setTimeout(()=>{
            init();
          },500)
        }else{
          messageApi.error(response.message);
        }
      });
  }, [sendWithReconnect, messageApi]);

  const init = useCallback(() => {
    let data = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")) : null;
    if (!data?.id) return;
    console.log(data, 'userData----1111');
    sendMessage("getConversationList", { userId: data.id });
  }, [isConnected, sendMessage, onConfirm]);

  useEffect(() => {
    const subscriptions = subscribe("ConversationList", (res) => {
      console.log(res,'ConversationList')
    if (res.code === 200) {
      const data = res.data;
      if (Array.isArray(data)) { // 确保数据有效性
        setChatData(data);
        if(contersionId){
          const target = data.find(item =>
            item.conversation_id === contersionId
          );
          if (target) {
            setSelectedKey(target.conversation_id);
            setChatWindowData(target);
          }
        }
      }
    } else {
      messageApi.error(res.message); // 修正为 res.message
    }
  });
  return () => {
    subscriptions?.unsubscribe()
  };
  }, [isConnected,sendMessage,subscribe]);

  useEffect(()=>{
    let data = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData")):localStorage.getItem("userData");
    setSlefInfo(data);
  },[isConnected])

  const showModal = () => {
    setIsModalOpen(true);
  };



  const handleCancel = () => {
    setIsModalOpen(false);
  };



  const actionItems = [
    { label: '发消息', action: () => message.info('开始聊天') },
  ];
  const listFn = (item)=>{
    dispatch(changeContersionId(item.conversation_id));
    setSelectedKey(item.conversation_id);
    setChatWindowData(item);
  }


  const timeFn = (time)=>{
    const date = new Date(time);

    // 直接使用 Asia/Shanghai 时区格式化
    const formatter = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const beijingTime = formatter.format(date);
    return beijingTime;
  }
  const items: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <div onClick={()=>{
          console.log(groupRef, 'groupRef');
          groupRef.current?.openModal();
        }}>
          <FileAddOutlined />
          <span style={{marginLeft: '8px'}}>发起群聊</span>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div onClick={showModal}>
          <UserAddOutlined />
          <span style={{marginLeft: '8px'}}>添加朋友</span>
        </div>
      ),
    }
  ];

  return (
    <div className="slef-container">
      <div className="chat-list-container">
        {contextHolder}
        <div className="search-bar custom-title-bar">
          <Search
            className='custom-title-bar-no'
            placeholder="搜索"
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: '100%' }}
          />
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomLeft" arrow={{ pointAtCenter: true }}>
            <Button type="default" color={"#bbb"} className='custom-title-bar-no' style={{backgroundColor: "#f5f5f5",borderColor: '#f5f5f5'}} icon={<UnorderedListOutlined />}></Button>
          </Dropdown>
        </div>
        <AddFriend isModalOpen={isModalOpen} handleCancel={handleCancel} isConnected={isConnected} />
        <AddGroup ref={groupRef} onConfirm={onConfirm}/>
        <Divider style={{ margin: '10px 0' }} />

        <List
          itemLayout="horizontal"
          dataSource={chatData}
          renderItem={(item) => (
            <List.Item className="chat-item"
              style={{
              cursor: 'pointer',
              backgroundColor: selectedKey === item.conversation_id ? '#e2e2e2' : 'transparent',
            }}>
              <List.Item.Meta
                avatar={<Avatar src={item.avatar} shape="square" />}
                title={<span>{item.username}</span>}
                description={item.last_msg_content?item.last_msg_content:"暂无消息"}
                onClick={() => {
                  listFn(item);
                }}
              />
              <div className="chat-item-right">
                <span className="time">{item.last_msg_time?formatChatTime(item.last_msg_time):null}</span>
                {item.unread_count > 0 && (
                  <span className="unread-badge">{item.unread_count}</span>
                )}
              </div>
            </List.Item>
          )}
        />
      </div>
      <ChatWindow chatData={chatWindowData} />

    </div>
  );
};

export default ChatList;
