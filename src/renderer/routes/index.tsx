import Home from '../pages/Home';
import Login from '../pages/login';
import Contact from '../pages/Contact';
import About from '../pages/Contact';
// import UserProfile from '../pages/UserProfile';
// import Dashboard from '../pages/Dashboard';
// import DashboardHome from '../pages/DashboardHome';
// import DashboardSettings from '../pages/DashboardSettings';
// console.log(Home())

const routes = [
  {
    path: '/',
    element: <Home />,
    auth: true
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/contact',
    element: <Contact />,
  },
  {
    path: '/about',
    element: <About />,
  }
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
