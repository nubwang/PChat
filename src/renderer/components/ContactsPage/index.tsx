import React from 'react';
import { Layout, Tabs, Input, List, Avatar, Button } from 'antd';
import {
  ContactsOutlined,
  TeamOutlined,
  SearchOutlined,
  LeftOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './style.css';

const { TabPane } = Tabs;
const { Content, Header } = Layout;
const { Search } = Input;

const contactsData = [
  {
    name: '张三',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      description: '前端开发工程师',
      region: '中国 北京',
      tags: ['同事', 'IT'],
      gender: '男'
  },
  {
    name: '李四',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      description: '产品经理',
      region: '中国 上海',
      tags: ['同事', 'IT'],
      gender: '女'
  },
  // 更多联系人...
];

const groupsData = [
  {
    name: '项目讨论组',
    avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
    description: '5人',
  },
  {
    name: '同学群',
    avatar: 'https://randomuser.me/api/portraits/lego/2.jpg',
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
interface ContactsPageProps {
  itemOnClick: (contact: ContactType) => void;
}

const ContactsPage: React.FC<ContactsPageProps> = ({itemOnClick}) => {
  const navigate = useNavigate();

  return (
    <Layout className="contacts-layout ContactsPage">
      <Header className="contacts-header">
        {/* <LeftOutlined
          onClick={() => navigate(-1)}
          className="back-icon"
        /> */}
        <span className="header-title">通讯录</span>
      </Header>
      <Content className="contacts-content">
        <div className="search-bar">
          <Search
            placeholder="搜索"
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: '100%' }}
          />
          <Button type="default" color={"#bbb"} style={{backgroundColor: "#f5f5f5",borderColor: '#f5f5f5'}} icon={<UserAddOutlined />}></Button>
        </div>
        <Tabs defaultActiveKey="1" className="contacts-tabs">
          <TabPane
            tab={
              <span>
                <ContactsOutlined />&nbsp;
                联系人
              </span>
            }
            key="1"
          >
            <List
              itemLayout="horizontal"
              dataSource={contactsData}
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
          </TabPane>
          <TabPane
            tab={
              <span>
                <TeamOutlined />&nbsp;
                群聊
              </span>
            }
            key="2"
          >
            <List
              itemLayout="horizontal"
              dataSource={groupsData}
              renderItem={(item) => (
                <List.Item className="contact-item">
                  <List.Item.Meta
                    avatar={<Avatar src={item.avatar} />}
                    title={<span>{item.name}</span>}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Content>
    </Layout>
  );
};

export default ContactsPage;
