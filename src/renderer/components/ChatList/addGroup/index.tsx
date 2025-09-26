import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Modal } from 'antd';
import type { ModalProps } from 'antd';

interface AddGroupProps {
  // 可以定义需要的 props
}

// 使用 forwardRef 并明确泛型类型（HTMLDivElement 或自定义类型）
const AddGroup = forwardRef<{ openModal: () => void }, AddGroupProps>((props, ref) => {
  const [isModalOpenGroup, setIsModalOpenGroup] = useState(false);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    openModal: () => setIsModalOpenGroup(true),
  }));

  const handleOkGroup = () => {
    setIsModalOpenGroup(false);
  };

  const handleCancelGroup = () => {
    setIsModalOpenGroup(false);
  };

  return (
    <Modal
      title="Basic Modal"
      open={isModalOpenGroup}
      onOk={handleOkGroup}
      onCancel={handleCancelGroup}
      footer={null} // 可选：隐藏默认按钮
    >
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
    </Modal>
  );
});

export default AddGroup;
