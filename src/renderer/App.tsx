import React,{ useEffect,useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import Home from './pages/Home'
import routes from './routes'
import Login from './pages/login';


export default function App() {
  const [login,setLogin] = useState(false)
  useEffect(()=>{
    console.log(Login,'LoginLoginLogin')
    let token = localStorage.getItem("token");
    if(token) setLogin(true)
  },[])
  return (
    <Router>
      <Routes>
        {
          login?
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
          :
          <Route path={"/"} element={<Login />} ></Route>
        }
      </Routes>
    </Router>
  );
}
