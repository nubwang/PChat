import React, { useState } from 'react';
import { Avatar, Button, message, Drawer, Badge, Dropdown, Menu } from 'antd';
import {
  UsergroupAddOutlined,
  UserOutlined,
  SettingOutlined,
  ExitOutlined,
  MoreOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import './style.css';

interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  isOwner: boolean;
}



const DrawerGroup: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  // 群成员数据
  const [groupMembers] = useState<GroupMember[]>([
    { id: '1', name: '张三', avatar: 'http://gips3.baidu.com/it/u=3886271102,3123389489&fm=3028&app=3028&f=JPEG&fmt=auto?w=1280&h=960', isOwner: false },
    { id: '2', name: '李四', avatar: 'http://gips3.baidu.com/it/u=3886271102,3123389489&fm=3028&app=3028&f=JPEG&fmt=auto?w=1280&h=960', isOwner: false },
    { id: '3', name: '王五', avatar: 'http://gips3.baidu.com/it/u=3886271102,3123389489&fm=3028&app=3028&f=JPEG&fmt=auto?w=1280&h=960', isOwner: true },
    { id: '4', name: '赵六', avatar: 'http://gips3.baidu.com/it/u=3886271102,3123389489&fm=3028&app=3028&f=JPEG&fmt=auto?w=1280&h=960', isOwner: false },
  ]);

  // 群信息
  const [groupInfo,setGroupInfo] = useState({
    name: '前端开发交流群',
    avatar: 'http://gips3.baidu.com/it/u=3886271102,3123389489&fm=3028&app=3028&f=JPEG&fmt=auto?w=1280&h=960',
    description: '这是一个前端技术交流群',
    memberCount: 28,
    announcement: '今晚8点有React源码分享会，请准时参加！',
  });

  // 退出群聊
  const handleExitGroup = () => {
    message.success('已退出群聊');
    onClose();
  };

  const handleChange = (value: string) => {
    console.log(`selected ${value}`);
  };

  return (
    <Drawer
      title={
        <div className="drawer-header">
          <Avatar src={groupInfo.avatar} size={40} />
          <div className="group-info">
            <h3>{groupInfo.name}</h3>
            <p>{groupInfo.description}</p>
          </div>
        </div>
      }
      getContainer={false}
      styles={{ mask: { backgroundColor: 'transparent' } }}
      closable={false}
      placement="right"
      onClose={onClose}
      open={open}
      width={300}
      className="group-drawer"
    >
      <div className="drawer-content">
        {/* 群公告 */}
        <div className="drawer-section">
          <h4>
            <Badge
              // dot
              // offset={[-5, 0]}
              >
              群公告
            </Badge>
          </h4>
          <div className="announcement">{groupInfo.announcement}</div>
        </div>

        {/* 群成员 */}
        <div className="drawer-section">
          <div className="section-header">
            <h4>
              <UsergroupAddOutlined /> 群成员 ({groupMembers?.length})
            </h4>
            <Button type="text" icon={<UserOutlined />}>
              添加
            </Button>
          </div>
          <div className="member-list">
            {groupMembers.map(member => (
              <div key={member.id} className="member-item">
                <Badge dot offset={[-5, 5]} color={member.isOwner ? 'gold' : 'green'}>
                  <Avatar src={member.avatar} size="small" />
                </Badge>
                <span className="member-name">{member.name}</span>
                {member.isOwner && <CrownOutlined className="owner-icon" />}
              </div>
            ))}
          </div>
        </div>

        {/* 群设置 */}

      </div>
    </Drawer>
  );
};

export default DrawerGroup;
