import React,{ useEffect } from 'react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { Layout } from 'antd';
import WeChatLayout from '../components/WeChatLayout';
// import { useSelector } from 'react-redux';
// import { RootState } from '../store';
// import './app.global.css';

const { Content } = Layout;

export default function App() {
  const navigate = useNavigate();
  // const { currentPath, previousPath } = useSelector( (state: RootState) => state.router );
  
  return (
      <Layout className="wechat-layout">
        <Content>
          {/* <div>{previousPath}{currentPath}</div> */}
          <WeChatLayout />
        </Content>
      </Layout>
  );
}
