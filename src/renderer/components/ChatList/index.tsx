import React, { useState,useEffect, useMemo, useCallback,useRef, use } from 'react';
import { Input, List, Avatar, Button, Modal,Search, Divider, Typography, Empty, message, Dropdown, Card } from 'antd';
import { SearchOutlined,UserAddOutlined,UnorderedListOutlined,UserOutlined,FileAddOutlined,ExclamationCircleFilled } from '@ant-design/icons';
import './style.css';
import ChatWindow from '../ChatWindow';
import { api } from "../../../static/api";
import { useNavigate,useLocation } from 'react-router-dom';
import { useSocket } from '../../store/useSocket';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { formatChatTime } from '../../../utils/timeConversion';
import { useDispatch } from 'react-redux';
import { changeContersionId, setChatData, updateConversation } from '../../store/routerSlice';
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
  const { sendMessage,subscribe,connectSocket,sendWithReconnect,reconnectSocket } = useSocket();
  const [chatWindowData, setChatWindowData] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const { Conversation } = location.state || {};
  const { isConnected } = useSelector( (state: RootState) => state.socket );
  const { contersionId, chatData } = useSelector( (state: RootState) => state.router );
  const groupRef = useRef<{ openModal: () => void; closeModal: () => void }>(null);
  //useRef
  const isMounted = useRef(false);
  // 修改后的 useEffect 逻辑
  useEffect(() => {
    if (isConnected && !isMounted.current) {
      window.electronChat.db.getConversationAll().then((data)=>{
        isMounted.current = true;
        dispatch(setChatData(data));
        let timer = setTimeout(()=>{
          init();
        },500)
      })
    }
    return ()=>{
      timer = null;
      isMounted.current = false;
    }
  }, [isConnected]); // 仅依赖 Conversation

  useEffect(() => {
    if(contersionId){
      const target = chatData.find(item =>
        item.conversation_id === contersionId
      );
      if (target) {
        setSelectedKey(target.conversation_id);
        setChatWindowData(target);
      }
    }
  }, [chatData]);

  const onConfirm = useCallback((selectedUsers) => {
      let data = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData")):localStorage.getItem("userData");
      let avatar = selectedUsers.map((user)=>user.head_img).slice(0,9);
      avatar.unshift(data.avatar);
      let groupName = selectedUsers.map((user)=>user.username);
      groupName.unshift(data.username);
      let groupData = {
        creatorId: data.id,
        memberIds: selectedUsers.map(user => user.user_id),
        groupName: groupName.join(","),
        avatar: JSON.stringify(avatar),
      }
      sendWithReconnect("createGroup", groupData);
  }, [sendWithReconnect, messageApi]);

  const init = useCallback(() => {
    let data = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")) : null;
    if (!data?.id) return;
    sendMessage("getConversationList", { userId: data.id });
  }, [isConnected, sendMessage, onConfirm]);

  useEffect(() => {
    const subscriptions = subscribe("ConversationList", (res) => {
      console.log(5)
      if (res.code === 200) {
        const data = res.data;
        if (Array.isArray(data)) { // 确保数据有效性
          dispatch(setChatData(data));
          window.electronChat.db.addConversation(data);
        }
      } else {
        messageApi.error(res.message); // 修正为 res.message
      }
    });

    const subscriptions2 = subscribe("conversationInfo", (res) => {
      console.log(4)
      if (res.code === 200) {
        const data = res.data;
        console.log(data,'0000000000000000000')
        dispatch(updateConversation(data));
      } else {
        messageApi.error(res.message); // 修正为 res.message
      }
    });
    //conversationActivated
    const subscriptions3 = subscribe("conversationActivated", (res) => {
      console.log(2)
      if (res.code === 200) {
        const data = res.data;
        sendMessage('get_conversation_info', {conversationId: data.conversationId, userId: data.userId});
      } else {
        messageApi.error(res.message); // 修正为 res.message
      }
    });
    // groupCreated
    const subscriptions4 = subscribe("groupCreated", (res) => {
      console.log(3)
      if(res.code == 200){
        sendMessage('get_conversation_info', {conversationId: res.conversationId, userId: slefInfo.id});
      }
    });
  return () => {
    subscriptions?.unsubscribe();
    subscriptions2?.unsubscribe();
    subscriptions3?.unsubscribe();
    subscriptions4?.unsubscribe();
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

  const reOnline = useCallback(()=>{
    reconnectSocket()
  },[reconnectSocket])



  const actionItems = [
    { label: '发消息', action: () => message.info('开始聊天') },
  ];
  const listFn = (item)=>{
    console.log(1,chatData)
    dispatch(changeContersionId(item.conversation_id));
    setSelectedKey(item.conversation_id);
    setChatWindowData(item);
    // activate_conversation
    sendMessage("activate_conversation", { conversationId: item.conversation_id, userId: slefInfo.id });
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
    <div className="slef-container" ref={isMounted}>
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
        {/* <Divider style={{ margin: '10px 0' }} /> */}
        {
          isConnected?
          null
          :
          <p className='offline' onClick={reOnline}><ExclamationCircleFilled style={{color: "#F22E0F"}} />&nbsp;&nbsp;网络已断开，检查网络后，点击重新</p>
        }

        <List
          style={{ flex: 1, overflowY: 'auto' }}
          itemLayout="horizontal"
          dataSource={chatData}
          renderItem={(item) => (
            <List.Item className="chat-item"
              style={{
              cursor: 'pointer',
              backgroundColor: selectedKey === item.conversation_id ? '#e2e2e2' : 'transparent',
            }}>
              <List.Item.Meta
                avatar={
                  item.peer_type === "group"?
                  <div className="avatar-grid">
                    {item.avatar&&JSON.parse(item.avatar || "{}").slice(0, 9).map((avatarUrl, index) => (
                      <Avatar
                        shape="square"
                        key={index}
                        src={avatarUrl}
                        size={12}  // 调整头像大小
                      />
                    ))}
                  </div>
                  :
                  <Avatar src={item.avatar} shape="square" />
                }
                title={item.username}
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
