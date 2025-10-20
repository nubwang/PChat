import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Modal, Button, Input, Avatar, List, Tag, Tooltip } from 'antd';
import type { ModalProps } from 'antd';
import { SearchOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import './style.css';

interface AddGroupProps {
  title?: string;
  modalProps?: ModalProps;
  onConfirm?: (selectedUsers: string[]) => void;
}

export interface AddGroupRef {
  openModal: () => void;
  closeModal: () => void;
}

// 模拟用户数据
const mockUsersData = [
  { id: '1', username: '张三', head_img: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { id: '2', username: '李四', head_img: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { id: '3', username: '王五', head_img: 'https://randomuser.me/api/portraits/men/3.jpg' },
  { id: '4', username: '赵六', head_img: 'https://randomuser.me/api/portraits/women/4.jpg' },
  { id: '5', username: '钱七', head_img: 'https://randomuser.me/api/portraits/men/5.jpg' },
  { id: '6', username: '孙八', head_img: 'https://randomuser.me/api/portraits/women/6.jpg' },
];

const AddGroupModal = forwardRef<AddGroupRef, AddGroupProps>(({
  title = "创建群聊",
  modalProps,
  onConfirm
}, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [mockUsers, setMockUsers] = useState(mockUsersData);

  useEffect(() => {
    console.log('Fetching users from database...');
    try {
      window.electronChat.db.getStatusFriends("accepted").then((data) => {
        console.log(data, '获取好友列表');
        setMockUsers(data);
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [isModalOpen]);

  useImperativeHandle(ref, () => ({
    openModal: () => {
      setIsModalOpen(true);
      setSelectedUsers([]);
    },
    closeModal: () => setIsModalOpen(false),
  }));

  const handleSelectUser = (userId: string) => {
    console.log(userId,'userId')
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleConfirm = () => {
    if (selectedUsers.length > 0) {
      console.log(selectedUsers,'selectedUsers')
      onConfirm?.(selectedUsers);
      setIsModalOpen(false);
    }
  };

  const filteredUsers = mockUsers?.filter?.(user =>
    user?.username?.toLowerCase().includes(searchValue?.toLowerCase())
  );

  return (
    <Modal
      title={title}
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      footer={null}
      width={480}
      className="group-creator-modal"
      {...modalProps}
    >
      <div className="group-creator-content">
        {/* 搜索框 */}
        <div className="group-creator-search-box">
          <Input
            placeholder="搜索联系人"
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {/* 已选成员展示 */}
        {selectedUsers.length > 0 && (
          <div className="group-creator-selected-users">
            <div className="group-creator-section-title">已选成员 ({selectedUsers.length})</div>
            <div className="group-creator-avatar-list">
              {selectedUsers.map(userId => {
                const user = mockUsers.find(u => u.user_id === userId);
                return user ? (
                  <Tooltip title={user.name} key={user.user_id}>
                    <Avatar
                      src={user.head_img}
                      size="small"
                      className="group-creator-selectable-avatar selected"
                    />
                  </Tooltip>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* 联系人列表 */}
        <div className="group-creator-contacts-section">
          <div className="group-creator-section-title">选择联系人</div>
          <List
            itemLayout="horizontal"
            dataSource={filteredUsers}
            renderItem={(user) => (
              <List.Item
                className="group-creator-contact-item"
                onClick={() => handleSelectUser(user.user_id)}
              >
                <div className="group-creator-contact-info">
                  <Avatar src={user.head_img} className="group-creator-selectable-avatar" />
                  <span className="group-creator-contact-name">{user.username}</span>
                </div>
                {selectedUsers.includes(user.user_id) && (
                  <Tag color="#07C160" className="group-creator-selected-tag">
                    <span className="icon-check">✓</span>
                  </Tag>
                )}
              </List.Item>
            )}
          />
        </div>

        {/* 底部按钮 */}
        <div className="group-creator-modal-footer">
          <Button
            type="primary"
            block
            disabled={selectedUsers.length === 0}
            onClick={handleConfirm}
            className="group-creator-confirm-btn"
          >
            <UsergroupAddOutlined /> 创建群聊 ({selectedUsers.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default AddGroupModal;
