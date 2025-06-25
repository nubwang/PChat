import axios from 'axios'

let api_base = "http://localhost:3000"
const api_version = "/api/"

type apiType = keyof typeof apiList;

const apiList = {
    user_login: 'user/login',
    uploadCOS: 'uploadCOS',
    article_add: 'article/add'
}

export const apiUrl = (x:apiType) => {
    var api_url = apiList[x]
    console.log(api_base + api_version + api_url,'api_base + api_version + api_url')
    return api_base + api_version + api_url
    // if (isProduction()) { } else { return api_base + api_version + api_url }
}
//h5.rubymall.com
// AppConfig.appid = 'pg.ios.rubymall.com';

const http = axios.create({});


http.interceptors.request.use((config) => {
    let params;
    let token = localStorage.getItem("token");
    if (token !== null) {
      config.headers.Authorization = "Bearer"+" "+token;
    }
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    console.log(config,'config')
    return config;
}, (error) => {
    return Promise.reject(error);
});

http.interceptors.response.use((response) => {
    console.log(response,'responseresponseresponseresponse')
    let code = response.data.code
    switch (code) {
        case 401:
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
    var pm = new Promise((resolve, reject) => {
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
        var url:string = apiUrl(key);
        return load_axios(url, "GET", params);
    },
    post: (key:apiType, params:any) => {
        var url:string = apiUrl(key);
        return load_axios(url, "POST", params);
    }
}
