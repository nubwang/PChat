import axios from 'axios'
// import { store } from '../../renderer/store';
export const navigateTo = (
  path: string, 
  action: 'push' | 'replace' = 'push',
  params?: Record<string, string> // 可选：携带路由参数
) => {
  // 开发环境打印调试信息
  console.log('[Navigation]', { path, action, params });
  
  if (window.electronAPI) {
    // Electron 环境：通过 IPC 跳转
    window.electronAPI.navigate(path, action);
  } else {
    // 非 Electron 环境（如浏览器）
    const hashPath = `#${path}${params ? '?' + new URLSearchParams(params).toString() : ''}`;
    
    if (action === 'replace') {
      window.location.replace(hashPath); // 替换当前历史记录
    } else {
      window.location.hash = hashPath; // 默认 push 方式
    }
  }
};

let api_base = "http://localhost:3000"
const api_version = "/api/"

type apiType = keyof typeof apiList;

const apiList = {
    user_login: 'user/login',
    uploadCOS: 'uploadCOS',
    article_add: 'article/add',
    info_other: 'user/info_other',
    info_self: 'user/info_self',
    friends_add: 'friends/add',
    friends_test: 'friends/test',
    friends_pending: 'friends/:userId/pending',
    friends_accept: 'friends/accept',
    friends_reject: 'friends/reject',
}

// export const apiUrl = (x:apiType) => {
//     var api_url = apiList[x]
//     console.log(api_base + api_version + api_url,'api_base + api_version + api_url')
//     return api_base + api_version + api_url
//     // if (isProduction()) { } else { return api_base + api_version + api_url }
// }

export const apiUrl = (x: apiType, params?: Record<string, string | number>) => {
    let api_url = apiList[x];
    if (params) {
        for (const key in params) {
            api_url = api_url.replace(`:${key}`, params[key].toString());
        }
    }
    return api_base + api_version + api_url;
};

const http = axios.create({});


http.interceptors.request.use((config) => {
    let params;
    let token = localStorage.getItem("token");
    if (token !== null) {
      config.headers.Authorization = "Bearer"+" "+token;
    }
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    return config;
}, (error) => {
    return Promise.reject(error);
});

http.interceptors.response.use((response) => {
    let code = response.data.code
    switch (code) {
        case 200:
            break
        case 401:
            navigateTo('/login', 'replace');
            localStorage.removeItem('token'); // 清除无效 token
            break
        case 500:
        case 20101:
        case 20102:
        case 20103:
        case 20105:
        case 20108:
            break
        default:
    }
    return response;
}, (error) => {
    return Promise.reject(error);
});

const load_axios = (url:string, method:string, params:any) => {
    let pm = new Promise((resolve, reject) => {
        if (method == 'GET' || method == 'get') {
            http.get(url, {
                params: params
            }).then((response) => {
                resolve(response.data)
            }).catch((response) => {
                reject(response)
            });
        } else if (method == 'POST' || method == 'post') {
            http.post(url, params).then((response) => {
                    resolve(response.data)
                }).catch((error) => {
                    reject(error.response)
                });
        }
    });
    return pm;
}

/**
 *	api接口封装，目前仅支持GET及POST
 **/
export const api = {
    get: (key:apiType, params:any) => {
        let url:string = apiUrl(key,params);
        return load_axios(url, "GET", params);
    },
    post: (key:apiType, params:any) => {
        let url:string = apiUrl(key);
        return load_axios(url, "POST", params);
    }
}
