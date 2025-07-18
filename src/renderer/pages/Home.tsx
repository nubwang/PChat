import React,{ useEffect } from 'react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { Layout } from 'antd';
import WeChatLayout from '../components/WeChatLayout';
// import './app.global.css';

const { Content } = Layout;

export default function App() {
  const navigate = useNavigate();
  
  return (
      <Layout className="wechat-layout">
        <Content>
          <WeChatLayout />
        </Content>
      </Layout>
  );
}
