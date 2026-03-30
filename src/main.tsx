import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.tsx'

console.log("--- TELEGRAM WEBAPP DEBUG ---");
console.log("Full InitData Raw:", window.Telegram?.WebApp?.initData);
console.log("User Data from Telegram:", window.Telegram?.WebApp?.initDataUnsafe?.user);

// Global Axios Logging Interceptor for Raw Queries
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("=== AUTH DEBUG === Generated/Active Token:", token);
  }
  console.log(`[Axios Request] URL: ${config.baseURL || ''}${config.url} | Method: ${config.method?.toUpperCase()} | Body:`, config.data);
  return config;
});

axios.interceptors.response.use(
  (response) => {
    console.log(`[Axios Response] Status: ${response.status} | URL: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    const token = localStorage.getItem('token');
    let reason = "";
    if (error.response?.status === 401) {
      reason = token ? "Token expired or invalid" : "Token missing";
    }
    console.error(`[Axios Error] Status: ${error.response?.status} | URL: ${error.config?.url} | Reason: ${reason} | Message: ${error.message}`, error.response?.data);
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
