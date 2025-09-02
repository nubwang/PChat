import React, {useEffect, useState} from 'react';
import { Layout, Menu, type MenuProps } from 'antd';
import {
  WechatOutlined,
  ContactsOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { changeTab } from '../../store/routerSlice'; // 路径根据实际情况调整
import type { RootState } from '../../store';

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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const tab = useSelector((state: RootState) => state.router.tab);
  // setSelectedKey(tab as string);
  useEffect(() => {
    if(tab){
      console.log(tab,'tabtabtabuseEffect')
      setSelectedKey(tab as string);
    }
  }, [tab]);
  //菜单选择
  const handleMenuSelect: MenuProps['onSelect'] = ({ key }) => {
    // setSelectedKey(key as string);
    dispatch(changeTab(key)); // 赋值tab
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
          selectedKeys={tab ? [tab] : ['1']}
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
