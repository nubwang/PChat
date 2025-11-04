import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from './index';
import { initUser } from './routerSlice';
//引入api
import { api } from '../../static/api/index';
export const updataUser = createAsyncThunk(
  'user/updata',
  async (config: { id?: number | string }, { dispatch }) => {
    try {
      console.log('更新用户信息中...');
      api.get('info_self',config).then((res:any)=>{
        if(res.code === 200){
          let data = res.data;
          console.log(data,'data-----22222')
          let userOlddata = localStorage.getItem('userData')?JSON.parse(localStorage.getItem('userData')||'{}'):{};
          console.log(data,'data')
          let userData = {...userOlddata,...data};
          console.log(userData,'userData-----11111')
          localStorage.setItem('userData', JSON.stringify(userData));
          dispatch(initUser(userData));
        }
      }).catch((error:any)=>{
        console.log(error,'error')
      });
      return true;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  }
);
