import React, { useState,useEffect, useMemo, useCallback } from 'react';
import { Input, List, Avatar, Button, Modal,Search, Divider, Typography, Empty, message } from 'antd';
import { SearchOutlined,UserAddOutlined,UserOutlined } from '@ant-design/icons';
import './style.css';
import ChatWindow from '../ChatWindow';
import { api } from "../../../static/api";
import { useNavigate,useLocation } from 'react-router-dom';
import { useSocket } from '../../store/useSocket';

const { Search,TextArea } = Input;

// const chatData = [
//   {
//     list_id: 1,
//     related_id: 1,
//     title: '张三',
//     avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgGoeqF3KfRAIo7d2MfKv2v0i7-NQGC1Olfg&s',
//     lastMessage: '你好，最近怎么样？',
//     time: '10:30',
//     unread: 2,
//   },
//   {
//     title: '李四',
//     avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgGoeqF3KfRAIo7d2MfKv2v0i7-NQGC1Olfg&s',
//     lastMessage: '项目进展如何？',
//     time: '昨天',
//     unread: 0,
//   },
//   {
//     title: '王二麻子',
//     avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgGoeqF3KfRAIo7d2MfKv2v0i7-NQGC1Olfg&s',
//     lastMessage: '啦啦啦',
//     time: '前天',
//     unread: 10,
//   },
//   // 更多聊天...
// ];


const ChatList: React.FC = () => {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading,setLoading] = useState(false);
  const [value,setValue] = useState("")
  const [contact,setContact] = useState({});
  const [infoItems,setInfoItems] = useState([]);
  const [addData,setAddData] = useState(null);
  const [slefInfo,setSlefInfo] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [leaveMessage,setLeaveMessage] = useState("");
  const [remarks,setRemarks] = useState("");
  const navigate = useNavigate();
  const { sendMessage,subscribe } = useSocket();
  const [chatData, setChatData] = useState([]);
  const [chatWindowData, setChatWindowData] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const { Conversation } = location.state || {};

  useEffect(() => {
    // 获取用户信息
    const userDataStr = localStorage.getItem("userData");
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    console.log(userData, '111111');

    if (!userData?.id) {
      console.error('未找到用户ID');
      return;
    }

    const user_id = userData.id;

    // 封装异步操作的函数
    const fetchData = async () => {
      try {
        // 获取会话列表
        const data = await window.electronChat.db.getConversationAll();
        console.log(data, Conversation, 'getConversationsByUserId');

        // 调用newList并等待结果
        const ConversationList = await newList(data, user_id);

        // 处理获取到的会话数据
        console.log(Conversation,'1111');
        setChatData(ConversationList);

        // 如果有传入Conversation，优先选中它
        if (Conversation) {
          ConversationList.forEach((item) => {
            console.log(item.conversation_id === Conversation.conversation_id,'Conversation');
            if (item.conversation_id === Conversation.conversation_id) {
              setSelectedKey(item.conversation_id);
              setChatWindowData(item);
            }
          });
        } else {
          // setSelectedKey(ConversationList[0]?.conversation_id || null);
          // setChatWindowData(ConversationList[0] || null);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    // 执行异步操作
    fetchData();

    // 订阅私聊消息
    const privateSub = subscribe("privateMessage", (data) => {
      console.log(data, 'privateMessage');
      if (data.code === 200) {
        // 处理私聊消息
      } else {
        messageApi.error(data.message);
      }
    });

    // 订阅群聊消息
    const groupSub = subscribe("groupMessage", (data) => {
      console.log(data, 'groupMessage');
      if (data.code === 200) {
        // 处理群聊消息
      } else {
        messageApi.error(data.message);
      }
    });

    // 清理订阅
    return () => {
      privateSub?.unsubscribe();
      groupSub?.unsubscribe();
    };
  }, [Conversation]);

  const newList = async (data, user_id) => {
    return Promise.all(data.map(async (item) => {
      try {
        const friendData = await window.electronChat.db.getFriendByUserId(
          user_id === item.user_id ? item.peer_id : item.user_id
        );

        return {
          ...item,
          name: friendData?.nickname || friendData?.username || '未知用户',
          avatar: friendData?.head_img || require('../../../static/img/5.jpg'),
          lastMessage: item.last_message || '暂无消息',
          time: item.updated_at ?
            new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          unread: item.unread_count || 0
        };
      } catch (error) {
        console.error('获取好友信息失败:', error);
        return {
          ...item,
          name: '未知用户',
          avatar: require('../../../static/img/5.jpg'),
          lastMessage: '消息加载失败',
          time: '',
          unread: 0
        };
      }
    }));
  };

  useEffect(()=>{
    let data = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData")):localStorage.getItem("userData");
    setSlefInfo(data);
  },[])
  const showModal = () => {
    // friends_test: 'friends/test'
    // navigate("/contact")
    // window.location.href = '/contact';
    setIsModalOpen(true);
    // console.log(location,'location')
    // api.get("friends_test").then((data)=>{
    //   console.log(data,'1111')
    // }).catch((err)=>{})
  };

  const handleOk = () => {
    setIsModalOpen(false);
    if(slefInfo.id == addData.id){
      return false;
    }
    let params = {
      userId: slefInfo.id,
      friendId: addData.id,
      notes: JSON.stringify([ {nickname: slefInfo.nickname,head_img: slefInfo.head_img,userId: slefInfo.id,remarks: remarks,leaveMessage:leaveMessage} ])
    }
    sendMessage("addFriend", params);
    //privateMessage
    subscribe("notice", (data) => {
      console.log(data,'addFriend');
      if(data.code === 200){
        messageApi.info(data.message);
      }else{
        messageApi.error(data.message);
      }
    });
    // api.post("friends_add",params).then((data)=>{
    //   console.log(data,'1111')
    //   messageApi.info(data.message);
    //   if(data.code === 401)navigate("/login")
    // }).catch((err)=>{})
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const onPressEnter = ()=>{
    api.get("info_other",{id: value}).then((data)=>{
      console.log(data,'1111')
      if(data.code === 200){
        let dataNew = data.data;
        setAddData(dataNew)
      }
      if(data.code === 401)navigate("/login")
    }).catch((err)=>{})
  }
  const onSearch = ()=>{
    api.get("info_other",{id: value}).then((data)=>{
      console.log(data,'1111')
      if(data.code === 200){
        let dataNew = data.data;
        setAddData(dataNew)
      }
      if(data.code === 401)navigate("/login")
    }).catch((err)=>{})
  }
  const onInput = (e)=>{
    setValue(e.target.value)
  }
  const actionItems = [
    { label: '发消息', action: () => message.info('开始聊天') },
  ];
  const listFn = (item)=>{
    console.log(item,'item')
    setSelectedKey(item.conversation_id);
    setChatWindowData(item);
  }
  const leaveMessageFn = (e)=>{
    console.log('11111',e.target.value)
    setLeaveMessage(e.target.value)
  }
  const remarksFn = (e)=>{
    setRemarks(e.target.value)
  }

  return (
    <div className="slef-container">
      <div className="chat-list-container">
        {contextHolder}
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
          title="申请添加朋友"
          closable={{ 'aria-label': 'Custom Close Button' }}
          open={isModalOpen}
          mask={false}
          closable={false}
          okText={"确定"}
          cancelText={"取消"}
          cancelButtonProps={}
          onOk={handleOk}
          onCancel={handleCancel}
        >
          <Divider />
          <Search value={value} onChange={onInput} placeholder="输入用户名手机号或者编号" addonBefore={<div>联系人</div>} prefix={<UserOutlined />} loading={loading} onPressEnter={onPressEnter} onSearch={onSearch} />
          <Divider />
          {
            addData && slefInfo.id != addData.id?
            <>
              <div>
                <Typography.Title level={5}>发送添加朋友申请</Typography.Title>
                <TextArea value={leaveMessage} onChange={leaveMessageFn} maxLength={100} placeholder="留言" style={{ height: 80, resize: 'none',backgroundColor: '#fff' }} />
              </div>
              <Divider />
              <div>
                <Typography.Title level={5}>设置备注</Typography.Title>
                <Input value={remarks} onChange={remarksFn} placeholder="备注" />
              </div>
              <Divider />
            </>
            :
            null
          }
          {
            addData?
            <div className="profile-section">
              <Avatar src={addData?.head_img} size={60} />
              <h3 className="contact-name">{addData?.nickname}</h3>
              <p className="contact-description">{addData?.id}</p>
            </div>
            :
            <Empty />
          }
        </Modal>
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
                avatar={<Avatar src={item.avatar} />}
                title={<span>{item.name}</span>}
                description={item.lastMessage}
                onClick={() => {
                  listFn(item);
                }}
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
      <ChatWindow chatData={chatWindowData} />

    </div>
  );
};

export default ChatList;
