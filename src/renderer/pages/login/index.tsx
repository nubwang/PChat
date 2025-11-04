import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import './style.css';
import { api } from '../../../static/api';
//引入routerSlice文件中的initUser方法
import { useDispatch } from 'react-redux';
import { initUser } from '../../store/routerSlice';


const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { currentPath, previousPath } = useSelector((state: RootState) => state.router);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'register') {
      if (!username || !password) {
        setError('请填写用户名和密码');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }

      api.post("user_register", {
        username,
        password
      }).then((data) => {
        if (data.code === 200) {
          setError(null);
          setMode('login');
        }
      }).catch(err => {
        setError(err.response?.data?.message || '注册失败');
      });
    } else {
      // 登录逻辑保持不变
      if (!username || !password) {
        setError('请输入用户名和密码');
        return;
      }

      api.post("user_login", { username, password })
        .then((data) => {
          if (data.code === 200) {
            window.electronChat.db.login(data.data?.data[0].id);
            localStorage.setItem("token", data.data.token);
            localStorage.setItem("userData", JSON.stringify(data.data?.data[0]));
            dispatch(initUser(data.data?.data[0]));
            const targetPath = currentPath === previousPath ? "/" : previousPath;
            navigate(targetPath);
          }
        })
        .catch(() => setError('用户名或密码错误'));
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{mode === 'login' ? '微信登录' : '注册账号'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="input-group">
              <input
                type="password"
                placeholder="确认密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="login-button"
          >
            {mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <p>
              没有账号？ <a onClick={() => setMode('register')}>立即注册</a>
            </p>
          ) : (
            <p>
              已有账号？ <a onClick={() => setMode('login')}>返回登录</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
