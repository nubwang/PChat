import React,{ useEffect,useState } from 'react';
import { Avatar, Button, Divider, List } from 'antd';
import { LeftOutlined, MoreOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './style.css';

const ContactDetailPage: React.FC = ({contactData}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [infoItems,setInfoItems] = useState([]);
  const [contact,setContact] = useState({});
  useEffect(()=>{
    if(contactData){
      let data = JSON.parse(contactData);
      setContact(data);
      setInfoItems([
        { label: '地区', value: data.region },
        { label: '备注名', value: data.note || '无' },
        { label: '标签', value: data.tags?.join('，') || '无' },
        { label: '性别', value: data.gender },
      ])
    }
    console.log(contact,infoItems,'contactData')
  },[contactData])

  const actionItems = [
    { label: '发消息', action: () => message.info('开始聊天') },
  ];



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
        <div className="profile-section">
          <Avatar src={contact.avatar} size={80} />
          <h3 className="contact-name">{contact.name}</h3>
          <p className="contact-description">{contact.description}</p>
        </div>

        <div className="action-buttons">
          {actionItems.map((item, index) => (
            <Button
              key={index}
              type="primary"
              block
              className="action-button"
              onClick={item.action}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <Divider />

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
