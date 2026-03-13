import axios from "axios";
import { url } from "../global";
import { dataDecrypt } from "../util";


const oficinaMFSApi = axios.create({
  baseURL: url, 
});

const token = dataDecrypt(localStorage.getItem('Token'));

oficinaMFSApi.interceptors.request.use(config => {
  config.headers = {
    ...config.headers,
    'x-access-token': token, // Usa la propiedad 'token' del objeto globalObject
  }
  return config;
});

export default oficinaMFSApi;
