import React, { useState,useEffect } from 'react';
import { Input, List, Avatar, Button, Modal,Search, Divider, Typography, Empty, message } from 'antd';
import { SearchOutlined,UserAddOutlined,UserOutlined } from '@ant-design/icons';
import './style.css';
import { api } from "../../../static/api";
import { useNavigate } from 'react-router-dom';

const { Search,TextArea } = Input;

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
  const [loading,setLoading] = useState(false);
  const [value,setValue] = useState("")
  const [contact,setContact] = useState({});
  const [infoItems,setInfoItems] = useState([]);
  const [addData,setAddData] = useState(null);
  const [slefInfo,setSlefInfo] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  useEffect(()=>{
    let data = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData")):localStorage.getItem("userData");
    setSlefInfo(data);
  },[])
  const showModal = () => {
    // navigate("/contact")
    // window.location.href = '/contact';
    // setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    if(slefInfo.id == addData.id){
      return false;
    }
    let params = {
      userId: slefInfo.id,
      friendId: addData.id,
      notes: JSON.stringify([ {nickname: slefInfo.nickname,head_img: slefInfo.head_img,userId: slefInfo.id,remarks: "大傻子",message:"加好友"} ])
    }
    api.post("friends_add",params).then((data)=>{
      console.log(data,'1111')
      messageApi.info(data.message);
      if(data.code === 401)navigate("/login")
    }).catch((err)=>{})
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
  const onChangeApply = ()=>{

  }
  const listFn = ()=>{
  }
  return (
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
              <TextArea maxLength={100} onChange={onChangeApply} placeholder="留言" style={{ height: 80, resize: 'none',backgroundColor: '#fff' }} />
            </div>
            <Divider />
            <div>
              <Typography.Title level={5}>设置备注</Typography.Title>
              <Input placeholder="备注" />
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
        {/* <List
          className="info-list"
          itemLayout="horizontal"
          dataSource={infoItems}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={<span className="info-label">{item.label}</span>}
                description={<span className="info-value">{item.value}</span>}
              />
            </List.Item>
          )} */}
        {/* /> */}
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
              onClick={listFn}
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
