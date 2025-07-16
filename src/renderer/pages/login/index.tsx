import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import './style.css'; // 样式文件
import { api } from '../../../static/api'

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
   const { currentPath, previousPath } = useSelector(
    (state: RootState) => state.router
  );

  const handleLogin = () => {
    console.log(api,'api')
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    api.post("user_login",{username,password}).then((data)=>{
      if(data.code === 200){
        // initFn();
        localStorage.setItem("token",data.data.token)
        localStorage.setItem("userData",JSON.stringify(data.data?.data[0]))
        let str = currentPath == previousPath?"/":previousPath
        navigate(str);
      }
    }).catch((err)=>{
      setError('用户名或密码错误');
      console.log(err,'err')
    })
  };
  const initFn = ()=>{
    api.get("info_self").then((data)=>{
      console.log(data,'info_self')
      if(data.code === 200){
        
      }
    }).catch((err)=>{
    })
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>微信登录</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="input-group">
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button className="login-button" onClick={handleLogin}>
          登录
        </button>
      </div>
    </div>
  );
};

export default LoginPage;