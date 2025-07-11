import React from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import { api } from "../../static/api";

function Contact() {
  const location = useLocation();
  const routeTo = ()=>{
    console.log(location,'location')
    api.get("friends_test").then((data)=>{
          console.log(data,'1111')
        }).catch((err)=>{})
  }
  return (
    <div>
      <h1 onClick={routeTo}>Contact Page</h1>
      <p>Get in touch with us.</p>
    </div>
  );
}

export default Contact;
