// 评审时请使用中文解答和建议
import React,{ useEffect,useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import routes from './routes'
import { useNavigate,useLocation } from 'react-router-dom';
import { Provider, useDispatch,useSelector } from 'react-redux';
import { store,RootState } from './store';
import { setCurrentPath } from './store/routerSlice';
import { useSocket } from './store/useSocket';


const RouteListener = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
      dispatch(setCurrentPath(location.pathname));
    }, [location]);
    return null; // 无UI组件
};

function AppContent() {
  const navigate = useNavigate();
  const { initializeSocket, connectSocket, subscribe, sendMessage } = useSocket();
  const token = localStorage.getItem('token') || '';
  const userData = localStorage.getItem('userData') || '';
  const { isConnected } = useSelector( (state: RootState) => state.socket );

  useEffect(() => {
    console.log(isConnected,'isConnected')
    if(isConnected){
      const subscriptions = subscribe("forceJoinRoom", (res) => {
        if (res.code === 200) {
          console.log(res,'forceJoinRoom')
          sendMessage('forceJoinRoom', { roomId: res.roomId, conversationId: res.conversationId });
        }
      });
      return () => subscriptions?.unsubscribe();
    }
  }, [isConnected]); // 仅依赖 Conversation

  useEffect(() => {
    // 初始化 Socket
    let userData = JSON.parse(localStorage.getItem("userData") || '{}');
    initializeSocket({
      url: 'http://localhost:3000',
      options: {
        auth: { token,userId: userData.id }
      }
    });
    // 连接 Socket
    connectSocket().catch(err => {
      console.error('Failed to connect:', err);
      // let userData = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData") || '{}'):{};
      // sendMessage("init", { userId: userData.id });
    });
    // 清理逻辑可在 useSocket 内部处理
  }, [initializeSocket, connectSocket, token]);

  useEffect(()=>{
    let token = localStorage.getItem("token");
    let userData = localStorage.getItem("userData")?JSON.parse(localStorage.getItem("userData") || '{}'):{};
    if(!token) navigate("/login")
      if(userData.id) window.electronChat.db.login(userData.id);
  },[token])

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
                  route.children?.map((child,childIndex)=>(
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
