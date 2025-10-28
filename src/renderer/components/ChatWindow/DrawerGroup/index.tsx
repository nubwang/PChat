import React, { useState, useEffect } from 'react';
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
import { useSocket } from '../../../store/useSocket';

interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  isOwner: boolean;
}



const DrawerGroup: React.FC<{ open: boolean; onClose: () => void; chatData:any }> = ({ open, onClose, chatData }) => {
  // 群成员数据
  const [groupMembers,setGroupMembers] = useState<GroupMember[]>([]);

  // 群信息
  const [groupInfo,setGroupInfo] = useState({} as any);

  const { sendMessage, subscribe } = useSocket();

  useEffect(() => {
    subscribe('groupMembers', (data: any) => {
      console.log('Received group members-------1111111:', data);
      if(data.code === 200){
        let groupInfo = { ...data.groupInfo };
        console.log(groupInfo,'groupInfogroupInfo------2222222')
        setGroupInfo(groupInfo);
        setGroupMembers(groupInfo.members || []);
      }
    });
  }, []);

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
          {
            chatData.peer_type !== "group"?
            <Avatar src={groupInfo.avatar_url} size={40}  shape="square" />
            :
            <div className="avatar-grid">
              {groupMembers.slice(0, 9).map((item) => (
                <Avatar
                  shape="square"
                  key={item.id}
                  src={item.avatar}
                  size={12}  // 调整头像大小
                />
              ))}
            </div>
          }
          <div className="group-info">
            <h3 className='ellipsis'>{groupInfo.group_name}</h3>
            <p>{groupInfo.announcement}</p>
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
          <h4> <Badge> 群公告 </Badge> </h4>
          <div className="announcement">{groupInfo.announcement?groupInfo.announcement:"群主比较懒，还有写任何公告"}</div>
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
            {groupMembers?.map(member => (
              <div key={member.id} className="member-item">
                <Badge dot offset={[-5, 5]} color={member.role ? 'owner' : 'member'}>
                  <Avatar src={member.avatar} size="small" shape="square" />
                </Badge>
                <span className="member-name">{member.username}</span>
                {member.role === 'owner' && <CrownOutlined className="owner-icon" />}
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
