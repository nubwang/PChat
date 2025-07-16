import React from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import { api } from "../../static/api";

function Contact() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeTo = ()=>{
    console.log(location,'location')
    api.get("friends_test").then((data)=>{
          console.log(data,'1111')
        }).catch((err)=>{})
  }
  const goBack = ()=>{
    navigate(-1)
  }
  return (
    <div>
      <h1 onClick={routeTo}>Contact Page</h1>
      <p onClick={goBack}>Get in touch with us.</p>
    </div>
  );
}

export default Contact;
