import React, { useState,useEffect, useMemo, useCallback } from 'react';
import { Input, List, Avatar, Button, Modal,Search, Divider, Typography, Empty, message } from 'antd';
import { SearchOutlined,UserAddOutlined,UserOutlined } from '@ant-design/icons';
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

const { Search,TextArea } = Input;


const ChatList: React.FC = () => {
  const dispatch = useDispatch();
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
  const { sendMessage,subscribe,connectSocket,sendWithReconnect } = useSocket();
  const [chatData, setChatData] = useState([]);
  const [chatWindowData, setChatWindowData] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const { Conversation } = location.state || {};
  const { isConnected } = useSelector( (state: RootState) => state.socket );
  const { contersionId } = useSelector( (state: RootState) => state.router );

  // 修改后的 useEffect 逻辑
useEffect(() => {
  console.log(isConnected,'isConnected')
    init();
}, [isConnected,sendMessage]); // 仅依赖 Conversation

const init = useCallback(() => {
  let data = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")) : null;
  if (!data?.id) return;
  console.log(data, 'userData');
  sendMessage("getConversationList", { userId: data.id });
}, [isConnected, sendMessage]);

  useEffect(() => {
    const subscriptions = subscribe("ConversationList", (res) => {
      console.log(res,'ConversationList')
    if (res.code === 200) {
      const data = res.data;
      if (Array.isArray(data)) { // 确保数据有效性
        setChatData(data);
        // if (Conversation) {
        //   const target = data.find(item =>
        //     item.conversation_id === Conversation.conversation_id
        //   );
        //   if (target) {
        //     setSelectedKey(target.conversation_id);
        //     setChatWindowData(target);
        //   }
        // }
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
    dispatch(changeContersionId(item.conversation_id));
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
