import React,{ useEffect,useState } from 'react';
import { Avatar, Button, Divider, List } from 'antd';
import { LeftOutlined, MoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './style.css';
import { api } from "../../../static/api";
import { useSocket } from '../../store/useSocket';

const ContactDetailPage: React.FC = ({contactData}) => {
  const navigate = useNavigate();
  const [infoItems,setInfoItems] = useState([]);
  const [contact,setContact] = useState(null);
  const [num,setNum] = useState(0);
  const { sendMessage } = useSocket();

  useEffect(()=>{
    if(contactData){
      let { data, type } = contactData;
      setContact(data);
      setInfoItems([
        { label: '地区', value: data?.region || '隐藏' },
        { label: '备注名', value: Array.isArray(contact?.notes) && contact.notes.length > 0 ? contact.notes[0]?.remarks : '无' },
        { label: '标签', value: data?.tags?.join('，') || '无' },
        { label: '性别', value: data?.gender || '隐藏' },
      ])
    }
  },[contactData])

  
  //下面写一个按钮接受的方法
  const handleAccept = () => {
    // 处理接受逻辑
    console.log('接受好友请求');
    // 可以在这里调用 API 或更新状态
    let data = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData")):localStorage.getItem("userData");
    api.post("friends_accept",{friendId: data.id,userId: contact.id}).then((data)=>{
      console.log(data,'1111')
      if(data.code === 200){
        setNum(num + 1);
      }
    }).catch((err)=>{})
  };

  // 拒绝按钮
  const handleReject = () => {
    // 处理拒绝逻辑
    console.log('拒绝好友请求');
    // 可以在这里调用 API 或更新状态
    let data = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData")):localStorage.getItem("userData");
    api.post("friends_reject",{friendId: data.id,userId: contact.id}).then((data)=>{
      console.log(data,'1111')
      if(data.code === 200){
        setNum(num - 1);
      }
    }).catch((err)=>{})
  };
  let actionItems = [];
  if(contactData&&contactData.type === 'pending'){
    actionItems = [
      { label: '接受', action: () => handleAccept(),type: 'cyan' },
      { label: '拒绝', action: () => handleReject(),type: 'default' },
    ];
  }else{
    actionItems = [
      { label: '发送消息', action: () => sendMessageFn(),type: 'cyan' },
    ];
  }
  const sendMessageFn = () => {
    let data = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData")):localStorage.getItem("userData");
    sendMessage('createChatSession', {});

    // 发送消息逻辑
    console.log('发送消息');
    // 可以在这里调用 API 或更新状态
    // navigate('/chat', { state: { contact } });
    return
    let params = {
      user_id: data.id,
      related_id: contact.id,
      conversation_type: 'private',
      title: contact.username,
      avatar: contact.head_img,
      lastMessage: '',
      created_at: Date.now(),
      unread_count: 0,
    };
    window.electronChat.db.addConversation(params);
    // getGroup(1);
    // return;
    navigate('/', { state: { conversation: params } });
    console.log(window.electronChat.db,params,data,'window.electronChat.db.addConversation')
  };
  

  return (
    <div className="contact-detail-container ContactDetailPage">
      <div className="contact-header">
        {/* <LeftOutlined
          onClick={() => navigate(-1)}
          className="back-icon"
        /> */}
        <span className="header-title">详细资料</span>
        <MoreOutlined className="more-icon" />
      </div>
      <div className="contact-content">
        {
          contact?
          <>
            <div className="profile-section">
              <Avatar src={contact.head_img} size={80} />
              <h3 className="contact-name">{contact.username}</h3>
              <p className="contact-description">{Array.isArray(contact?.notes) && contact.notes.length > 0 ? contact.notes[0]?.leaveMessage : ''}</p>
            </div>

            <div className="action-buttons">
              {actionItems.map((item, index) => (
                <Button
                  key={index}
                  color={item.type}
                  variant="solid"
                  className="action-button"
                  onClick={item.action}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <Divider />
          </>
          :null
        }


        <List
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
          )}
        />
      </div>
    </div>
  );
};

export default ContactDetailPage;
