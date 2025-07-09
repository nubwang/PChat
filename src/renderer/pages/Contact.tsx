import React from 'react';
import { api } from "../../static/api";

function Contact() {
  const routeTo = ()=>{
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
