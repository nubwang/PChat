import React, {useState} from 'react';
import { Layout, Menu, type MenuProps, Button } from 'antd';
import {
  WechatOutlined,
  ContactsOutlined,
  CompassOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, Outlet } from 'react-router-dom';
import ChatList from '../ChatList';

import ContactsPage from '../ContactsPage';
import ContactDetailPage from '../ContactDetailPage';
//引入退出登录组件
import Seting from '../Seting';
import './style.css';

const { Sider, Content } = Layout;
type MenuItem = Required<MenuProps>['items'][number];
const items: MenuItem[] = [
  {
    label: '',
    key: '1',
    icon: <WechatOutlined style={{ fontSize: '26px' }} />,
  },
  {
    label: '',
    key: '2',
    icon: <ContactsOutlined style={{ fontSize: '26px'}} />,
  },
  {
    label: '',
    key: '3',
    icon: <SettingOutlined style={{ fontSize: '26px'}} />,
  }
]

const WeChatLayout: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState<string>('1');
  const navigate = useNavigate();
  
  //菜单选择
  const handleMenuSelect: MenuProps['onSelect'] = ({ key }) => {
    setSelectedKey(key as string);
    console.log(key, 'keykeykeykeykey');
    if(key === '1'){
      navigate('/');
    }
    if(key === '2'){
      navigate('/contacts_page');
    }
    if(key === '3'){
      navigate('/seting');
    }
  };
  return (
    <Layout className="wechat-container WeChatLayout">
      <Sider width={80} className="sidebar">
        <Menu
          mode="vertical"
          defaultSelectedKeys={['1']}
          onSelect={(i)=>{handleMenuSelect(i)}}
          className="sidebar-menu"
          items={items}
        >
        </Menu>
      </Sider>
      <Outlet />
      {/* {
        selectedKey !== "3"?
        <>
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
        </>
        : 
        <Seting />
      } */}
    </Layout>
  );
};

export default WeChatLayout;
