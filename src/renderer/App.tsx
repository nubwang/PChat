import React,{ useEffect,useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import Home from './pages/Home'
import routes from './routes'
import Login from './pages/login';
import { customHistory } from '../static/utils/router';
import { useNavigate,useLocation } from 'react-router-dom';

function AppContent() {
  const navigate = useNavigate();
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
    <Router>
      <AppContent />
    </Router>
  );
}