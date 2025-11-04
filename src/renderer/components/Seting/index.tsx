import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { Button, Layout, Image, Upload, Form, Input, Card, message, Tabs } from 'antd';
import type { GetProp, UploadFile, UploadProps } from 'antd';
import { useDispatch } from 'react-redux';
import { useSocket } from '../../store/useSocket';
import './style.css';
import { api } from "../../../static/api";
import axios from 'axios';
import { updataUser } from '../../store/actionThunks';
//引入RootState，useSelector
import { RootState } from '../../store';
import { useSelector } from 'react-redux';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
const { Content } = Layout;

const Seting: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { disconnectSocket } = useSocket();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState<UploadFile>([]);
  const [userInfo, setUserInfo] = useState({});
  const [passwordError, setPasswordError] = useState('');
  const { userData } = useSelector( (state: RootState) => state.router );

  useEffect(() => {
    // 模拟获取用户信息
      try {
        console.log('userData',userData);
        setUserInfo(userData);
        setFileList([{
          uid: '-1',
          name: 'avatar.png',
          status: 'done',
          url: userData.avatar
        }]);
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
  }, [userData]);

  // 退出登录方法
  const handleLogout = () => {
    disconnectSocket();
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    navigate('/login');
  };
  const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as FileType);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  // 自定义上传方法
  const customRequest = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;
    const data = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData")):null;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('url', data.avatar);
    formData.append('id', data.id);

    try {
      const response = await axios.post(
        `http://localhost:3000/api/uploadCOS/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.floor((progressEvent.loaded / progressEvent.total) * 100);
            onProgress({ percent });
          }
        }
      );

      if (response.data.code === 200) {
        const newFileList = {
          uid: file.uid,
          status: 'done',
          url: response?.data?.data?.imageUrl,
          name: file.name
        };
        dispatch(updataUser({id: data.id}));
        setFileList(newFileList);
        onSuccess('上传成功');
        message.success('图片上传成功');
      } else {
        throw new Error(response.data.msg || '上传失败');
      }
    } catch (error) {
      console.error('上传错误:', error);
      onError(error);
      message.error('图片上传失败');
      setFileList(fileList.filter(item => item.uid !== file.uid));
    }
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    const filteredList = newFileList.filter(file =>
      file.status !== 'error' || file.originFileObj
    );
    setFileList(filteredList);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({ ...prev, [name]: value }));
  };

  const validatePasswords = () => {
    if (userInfo.newPassword !== userInfo.confirmPassword) {
      setPasswordError('两次输入的新密码不一致');
      return false;
    }else{
      setPasswordError('');
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = (values: any) => {

    if (!validatePasswords()) {
      return;
    }

     api.post("updateUser", { nickname: userInfo.nickname, email: userInfo.email,password: userInfo.newPassword, id: userData.id })
    .then((data) => {
      if (data.code === 200) {
        message.success('用户信息更新成功！');
        dispatch(updataUser({id: userInfo.id}));
      }else{
        setPasswordError('');
      }
    })
    .catch(() => setPasswordError('用户信息更新失败！'));

    console.log('更新用户信息:', userInfo);
  };

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );
  const onBlur = () => {
    console.log('onBlur');
    if (!userInfo.password) {
      setPasswordError('请输入原始密码');
      return;
    }

    api.post("user_login", { username: userInfo.username, password: userInfo.password })
    .then((data) => {
      if (data.code !== 200) {
        setPasswordError('原密码输入错误!');
      }else{
        setPasswordError('');
      }
    })
    .catch(() => setPasswordError('原密码输入错误!'));

  };

  return (
    <Layout className="settings-layout">
      <Content className="settings-content">
        <Card
          title={
            <div className="card-header">
              <UserOutlined style={{ marginRight: 8 }} />
              账户设置
            </div>
          }
          className="account-card"
        >
          <div className="profile-section">
            <div className="avatar-container">
              <Upload
                customRequest={customRequest}
                maxCount={1}
                listType="picture-card"
                fileList={fileList}
                onPreview={handlePreview}
                onChange={handleChange}
                beforeUpload={() => true}
              >
                {fileList.length >= 2 ? null : uploadButton}
              </Upload>
              <p className="username">{userInfo.username}</p>
            </div>

            <Form onFinish={handleSubmit} className="user-form">
              <Tabs defaultActiveKey="1" className="settings-tabs">
                <Tabs.TabPane tab="基本信息" key="1">
                  <Form.Item label="昵称">
                    <Input
                      prefix={<UserOutlined />}
                      name="nickname"
                      value={userInfo.nickname}
                      onChange={handleInputChange}
                    />
                  </Form.Item>

                  <Form.Item label="邮箱">
                    <Input
                      prefix={<MailOutlined />}
                      name="email"
                      value={userInfo.email}
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Tabs.TabPane>

                <Tabs.TabPane tab="安全设置" key="2">
                  <Form.Item label="原密码">
                    <Input.Password
                      prefix={<LockOutlined />}
                      name="password"
                      value={userInfo.password}
                      onBlur={onBlur}
                      onChange={handleInputChange}
                      placeholder="请输入原密码"
                    />
                  </Form.Item>

                  <Form.Item label="新密码">
                    <Input.Password
                      prefix={<LockOutlined />}
                      name="newPassword"
                      value={userInfo.newPassword}
                      onChange={handleInputChange}
                      placeholder="请输入新密码"
                    />
                  </Form.Item>

                  <Form.Item label="确认新密码">
                    <Input.Password
                      prefix={<LockOutlined />}
                      name="confirmPassword"
                      value={userInfo.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="请再次输入新密码"
                    />
                    {passwordError && <div className="error-message">{passwordError}</div>}
                  </Form.Item>
                </Tabs.TabPane>
              </Tabs>

              <Form.Item>
                <Button type="primary" htmlType="submit">
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Card>

        <Button type="primary" danger onClick={handleLogout} className="logout-btn">
          退出登录
        </Button>

        {previewImage && (
          <Image
            wrapperStyle={{ display: 'none' }}
            preview={{
              visible: previewOpen,
              onVisibleChange: (visible) => setPreviewOpen(visible),
              afterOpenChange: (visible) => !visible && setPreviewImage(''),
            }}
            src={previewImage}
          />
        )}
      </Content>
    </Layout>
  );
};

export default Seting;
