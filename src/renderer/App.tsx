import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import Home from './pages/Home'
import routes from './routes'


export default function App() {
  return (
    <Router>
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
    </Router>
  );
}
