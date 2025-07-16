import React,{ useEffect,useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import Home from './pages/Home'
import routes from './routes'
import Login from './pages/login';
import { customHistory } from '../static/utils/router';
import { useNavigate,useLocation } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store/store';
import { setCurrentPath } from './store/routerSlice';
import socketService from '../static/utils/socketService';


const RouteListener = () => {
  const location = useLocation();
  const dispatch = useDispatch();


  useEffect(() => {
    dispatch(setCurrentPath(location.pathname));
  }, [location]);

    return null; // 无UI组件
};
function AppContent() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // 连接到 Socket.IO 服务器
    // 注意：在开发环境中可能需要使用完整的 URL
    let userData = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData")):localStorage.getItem("userData"); 
    let token = localStorage.getItem("token"); 
    if(userData){
      socketService.connect('http://localhost:3000', userData?.id, token); // 替换为你的服务器地址
      // 监听消息事件
      const handleNewMessage = (message: Message) => {
        console.log(message,'messagemessagemessage')
        setMessages((prev) => [...prev, message]);
      };
   
      socketService.on('message', handleNewMessage);
   
      // 组件卸载时清理
      return () => {
        socketService.off('message', handleNewMessage);
        socketService.disconnect();
      };
    }
  }, []);


  useEffect(()=>{
    let token = localStorage.getItem("token");
    if(!token) navigate("/login")
  },[])
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleNavigation = ({ path, action }: { path: string; action: 'push' | 'replace' }) => {
      navigate(path, { replace: action === 'replace' });
    };

    window.electronAPI.onNavigate(handleNavigation);

    return () => {
      window.electronAPI?.removeNavigationListener(); // 安全清理
    };
  }, [navigate]);
  return (
      <Routes>
        {
          routes.map((route,index)=>(
              <Route key={index} path={route.path} element={route.element} >
                {
                  route?.children?.map((child,childIndex)=>(
                    <Route
                      key={childIndex}
                      path={child.path}
                      element={child.element}
                    />
                  ))
                }
              </Route>
          ))
        }
      </Routes>
  );
}
export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <RouteListener />
        <AppContent />
      </Router>
    </Provider>
  );
}