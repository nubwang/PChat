import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, type MenuProps,Layout } from 'antd';
import { useSocket } from '../../store/useSocket';
import './style.css';
const { Sider, Content } = Layout;
const Seting: React.FC = () => {
  const navigate = useNavigate();
  const { disconnectSocket } = useSocket();
  //退出登录方法
  const handleLogout = () => {
    console.log('退出登录');
    // 清除用户数据
    disconnectSocket(); // 断开 Socket 连接
    // 清除本地存储的用户数据
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    // 跳转到登录页面
    navigate('/login');
  };
  return (
    <Layout className="settings-layout">
      <Content className="settings-content">
        <h2>设置</h2>
        <p>这里可以放置设置相关的内容。</p>
        <Button type="primary" onClick={ handleLogout }>退出登录</Button>
      </Content>
    </Layout>
  );
};

export default Seting;
