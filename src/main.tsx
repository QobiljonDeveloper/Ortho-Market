import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import VConsole from 'vconsole'
import './index.css'
import App from './App.tsx'

// Initialize vConsole for mobile debugging in development or when ?debug=true is passed
if (import.meta.env.MODE === 'development' || window.location.search.includes('debug=true')) {
  new VConsole();
}




// Global Axios Logging Interceptor for Raw Queries
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => {
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
