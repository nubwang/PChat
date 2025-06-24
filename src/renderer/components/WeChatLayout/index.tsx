import React, {useState} from 'react';
import { Layout, Menu } from 'antd';
import {
  WechatOutlined,
  ContactsOutlined,
  CompassOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ChatList from '../ChatList';
import ChatWindow from '../ChatWindow';
import ContactsPage from '../ContactsPage';
import ContactDetailPage from '../ContactDetailPage';
import './style.css';

const { Sider, Content } = Layout;

const WeChatLayout: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState<string>('1');
  const navigate = useNavigate();
  const [ contactData, setContactData ] = useState<string>('');
  const itemOnClick = (data)=>{
    console.log(data,'datadatadatadatadata')
    let newData = JSON.stringify(data)
    setContactData(newData)
  }
  return (
    <Layout className="wechat-container WeChatLayout">
      <Sider width={80} className="sidebar">
        <Menu
          mode="vertical"
          defaultSelectedKeys={['1']}
          onSelect={(i)=>{setSelectedKey(i.key)}}
          className="sidebar-menu"
        >
          <Menu.Item key="1" className='muenIcon' icon={<WechatOutlined style={{ fontSize: '26px', color: selectedKey == "1" ?'#08c':'#bbb' }} />} />
          <Menu.Item key="2" className='muenIcon' icon={<ContactsOutlined style={{ fontSize: '26px', color: selectedKey == "2" ?'#08c':'#bbb' }} />} />
          <Menu.Item key="4" className='muenIcon' icon={<SettingOutlined style={{ fontSize: '26px', color: selectedKey == "4" ?'#08c':'#bbb' }} />} />
        </Menu>
      </Sider>
      <Sider width={300} className="chat-list-sidebar">
        {
          selectedKey == "1"?
          <ChatList /> : null
        }
        {
          selectedKey == "2"?
          <ContactsPage itemOnClick={itemOnClick} /> : null
        }
      </Sider>
      <Content className="chat-content">
        {
          selectedKey == "1"?
          <ChatWindow /> : null
        }
        {
          selectedKey == "2"?
          <ContactDetailPage contactData={contactData} /> : null
        }

      </Content>
    </Layout>
  );
};

export default WeChatLayout;
