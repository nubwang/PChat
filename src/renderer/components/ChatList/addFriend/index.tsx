import React, { useState,useEffect } from 'react';
import { Avatar, Input, Button, Modal,Divider ,Typography,Empty,message} from 'antd';
import { SmileOutlined,UserOutlined } from '@ant-design/icons';
import { api } from "../../../../static/api";
import './style.css';
import { useSocket } from '../../../store/useSocket';
const { Search,TextArea } = Input;

const AddFriend: React.FC = ({isModalOpen,handleCancel,isConnected}) => {
  const [value,setValue] = useState("")
  const [loading,setLoading] = useState(false);
  const [addData,setAddData] = useState(null);
  const [slefInfo,setSlefInfo] = useState(null);
  const [remarks,setRemarks] = useState("");
  const { sendMessage,subscribe,connectSocket,sendWithReconnect } = useSocket();
  const [messageApi, contextHolder] = message.useMessage();
  const [leaveMessage,setLeaveMessage] = useState("");
  const onPressEnter = ()=>{
      api.get("info_other",{id: value}).then((data)=>{
        console.log(data,'1111')
        if(data.code === 200){
          let dataNew = data.data;
          setAddData(dataNew)
        }
        if(data.code === 401)navigate("/login")
      }).catch((err)=>{})
    }
  const onSearch = ()=>{
    api.get("info_other",{id: value}).then((data)=>{
      console.log(data,'1111')
      if(data.code === 200){
        let dataNew = data.data;
        setAddData(dataNew)
      }
      if(data.code === 401)navigate("/login")
    }).catch((err)=>{})
  }
  const onInput = (e)=>{
    setValue(e.target.value)
  }
  useEffect(()=>{
    let userData = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData")):localStorage.getItem("userData");
    setSlefInfo(userData);
  },[isConnected])
  const leaveMessageFn = (e)=>{
    console.log('11111',e.target.value)
    setLeaveMessage(e.target.value)
  }
  const remarksFn = (e)=>{
    setRemarks(e.target.value)
  }
  const handleOk = () => {
    handleCancel();
    if(slefInfo.id == addData.id){
      return false;
    }
    let params = {
      userId: slefInfo.id,
      friendId: addData.id,
      notes: JSON.stringify([ {nickname: slefInfo.nickname,head_img: slefInfo.head_img,userId: slefInfo.id,remarks: remarks,leaveMessage:leaveMessage} ])
    }
    sendMessage("addFriend", params);
    //privateMessage
    subscribe("notice", (data) => {
      console.log(data,'addFriend');
      if(data.code === 200){
        setAddData(null);
        setValue("");
        setRemarks("");
        setLeaveMessage("");
        messageApi.info(data.message);
      }else{
        messageApi.error(data.message);
      }
    });
  };
  return (
    <Modal
      title="申请添加朋友"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={isModalOpen}
      mask={false}
      closable={false}
      okText={"确定"}
      cancelText={"取消"}
      cancelButtonProps={}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Divider />
      <Search value={value} onChange={onInput} placeholder="输入用户名手机号或者编号" addonBefore={<div>联系人</div>} prefix={<UserOutlined />} loading={loading} onPressEnter={onPressEnter} onSearch={onSearch} />
      <Divider />
      {
        addData && slefInfo.id != addData.id?
        <>
          <div>
            <Typography.Title level={5}>发送添加朋友申请</Typography.Title>
            <TextArea value={leaveMessage} onChange={leaveMessageFn} maxLength={100} placeholder="留言" style={{ height: 80, resize: 'none',backgroundColor: '#fff' }} />
          </div>
          <Divider />
          <div>
            <Typography.Title level={5}>设置备注</Typography.Title>
            <Input value={remarks} onChange={remarksFn} placeholder="备注" />
          </div>
          <Divider />
        </>
        :
        null
      }
      {
        addData?
        <div className="profile-section">
          <Avatar src={addData?.head_img} size={60} />
          <h3 className="contact-name">{addData?.nickname}</h3>
          <p className="contact-description">{addData?.id}</p>
        </div>
        :
        <Empty />
      }
    </Modal>
  );
};

export default AddFriend;
