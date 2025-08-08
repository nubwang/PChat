import Home from '../pages/Home';
import Login from '../pages/login';
import ChatList from '../components/ChatList';
import ContactsPage from '../components/ContactsPage';
import Seting from '../components/Seting';
// import { Children } from 'react';
// import UserProfile from '../pages/UserProfile';
// import Dashboard from '../pages/Dashboard';
// import DashboardHome from '../pages/DashboardHome';
// import DashboardSettings from '../pages/DashboardSettings';
// console.log(Home())

const routes = [
  {
    path: '/',
    element: <Home />,
    auth: true,
    children: [
      { path: '/', element: <ChatList /> }, // 聊天列表 
      { path: '/contacts_page', element: <ContactsPage /> }, // 联系人页面
      { path: 'seting', element: <Seting /> }, // 设置页面
    ]
  },
  {
    path: '/login',
    element: <Login />,
  }
  // {
  //   path: '/chat_list',
  //   element: <ChatList />,
  // },
  // {
  //   path: '/contacts_page',
  //   element: <ContactsPage />,
  // }
  // {
  //   path: '/user/:id',
  //   element: <UserProfile />,
  // },
  // {
  //   path: '/dashboard',
  //   element: <Dashboard />,
  //   children: [
  //     {
  //       index: true, // 默认子路由
  //       element: <DashboardHome />,
  //     },
  //     {
  //       path: 'settings',
  //       element: <DashboardSettings />,
  //     },
  //   ],
  // },
];

export default routes;
