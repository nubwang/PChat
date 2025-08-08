import React,{ useState,useEffect } from 'react';
import type { CollapseProps } from 'antd';
import { Layout, Tabs, Input, List, Avatar, Button, Collapse, Avatar, List } from 'antd';
import {
  ContactsOutlined,
  TeamOutlined,
  SearchOutlined,
  LeftOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './style.css';
import { api } from '../../../static/api';
import { useSocket } from '../../store/useSocket';
import ContactDetailPage from '../ContactDetailPage';

const { TabPane } = Tabs;
const { Content, Header } = Layout;
const { Search } = Input;

const contactsData = [
  {
    name: '张三1',
      avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgGoeqF3KfRAIo7d2MfKv2v0i7-NQGC1Olfg&s',
      description: '前端开发工程师',
      region: '中国 北京',
      tags: ['同事', 'IT'],
      gender: '男'
  },
  {
    name: '李四',
      avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgGoeqF3KfRAIo7d2MfKv2v0i7-NQGC1Olfg&s',
      description: '产品经理',
      region: '中国 上海',
      tags: ['同事', 'IT'],
      gender: '女'
  },
  // 更多联系人...
];

const groupsData = [
  {
    name: '项目讨论组1',
    avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgGoeqF3KfRAIo7d2MfKv2v0i7-NQGC1Olfg&s',
    description: '5人',
  },
  {
    name: '同学群',
    avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgGoeqF3KfRAIo7d2MfKv2v0i7-NQGC1Olfg&s',
    description: '30人',
  },
  // 更多群组...
];

const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`;
const data = [
  {
    name: '项目讨论组',
    avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgGoeqF3KfRAIo7d2MfKv2v0i7-NQGC1Olfg&s',
    description: '5人',
  },
  {
    name: '同学群',
    avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgGoeqF3KfRAIo7d2MfKv2v0i7-NQGC1Olfg&s',
    description: '30人',
  },
  // 更多群组...
];



interface ContactType {
  avatar: string;
  name: string;
  description: string;
  // 其他联系人属性
}
//friends_pending
const ContactsPage: React.FC<ContactsPageProps> = ({}) => {
  const [friendsPending,setFriendsPending] = useState([]);
  const [friendAccepted,setFriendAccepted] = useState([]);
  const navigate = useNavigate();
  const [newFriend,setNewFriend] = useState([]);
  const { sendMessage,subscribe } = useSocket();
  const [ contactData, setContactData ] = useState(null);

  useEffect(()=>{
    getPendingFriend()
  },[])
  //获取好友请求
  const getPendingFriend = ()=>{
    let data = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData")):localStorage.getItem("userData");
    console.log('11111')
    sendMessage("init", {userId: data.id});
    subscribe("init", (data) => { 
      if(data.code === 200){
        setFriendsPending(data.data.friendPending);
        setFriendAccepted(data.data.friendAccepted);
      }else{
        message.error(data.message);
      }
    });
  }
  const onChange = ()=>{

  }
  const itemOnClick = (data)=>{
    console.log(data,'datadatadatadatadata')
    setContactData(data)
  }
  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: '新朋友',
      children: <List
      itemLayout="horizontal"
      dataSource={friendsPending}
      renderItem={(item, index) => (
        <List.Item className="contact-item">
          <List.Item.Meta
            avatar={<Avatar src={item.head_img} />}
            title={<span>{item.username}</span>}
            description={item?.notes[0]?.leaveMessage}
            onClick={()=>{itemOnClick({data: item,type: 'pending'})}}
          />
        </List.Item>
      )}
    />,
    },
    {
      key: '2',
      label: '联系人',
      children: <List
        itemLayout="horizontal"
        dataSource={friendAccepted}
        renderItem={(item) => (
          <List.Item className="contact-item">
            <List.Item.Meta
              avatar={<Avatar src={item.head_img} />}
              title={<span>{item.username}</span>}
              // description={item.description}
              onClick={()=>{itemOnClick({data: item,type: 'accepted'})}}
            />
          </List.Item>
        )}
      />
    },
    {
      key: '3',
      label: '群聊',
      children: <List
        itemLayout="horizontal"
        dataSource={groupsData}
        renderItem={(item) => (
          <List.Item className="contact-item">
            <List.Item.Meta
              avatar={<Avatar src={item.avatar} />}
              title={<span>{item.name}</span>}
              description={item.description}
              onClick={()=>{itemOnClick(item)}}
            />
          </List.Item>
        )}
      />
    }
  ];

  return (
    <div className='slef-container'>
      <div className="ContactsPage">
        <Header className="contacts-header">
          <Search
            placeholder="搜索"
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: '100%' }}
          />
          <Button type="default" color={"#bbb"} style={{backgroundColor: "#f5f5f5",borderColor: '#f5f5f5'}} icon={<UserAddOutlined />}></Button>
        </Header>
        <Content className="contacts-content">
          <Collapse items={items} defaultActiveKey={['1']} onChange={onChange} />
        </Content>
      </div>
      <ContactDetailPage contactData={contactData} />
    </div>
  );
};

export default ContactsPage;
