import axios from 'axios';
import { toast } from 'sonner';

export const api = axios.create({
    baseURL: 'https://ortadant-markert-api.kubesec.uz',
    withCredentials: false,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: attach JWT + sanitize URLs
api.interceptors.request.use((config) => {
    // Attach token
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("=== AUTH DEBUG === [custom instance] Active Token:", token);
    }

    // Sanitize URL: remove double slashes (except after protocol) and trailing slashes
    if (config.url) {
        config.url = config.url.replace(/([^:]\/)\/+/g, '$1').replace(/\/+$/, '');
    }

    console.log(`[API Request] URL: ${config.baseURL || ''}${config.url} | Method: ${config.method?.toUpperCase()} | Body:`, config.data);

    return config;
});

// Response Interceptor: specific error toasts instead of crashing the UI
api.interceptors.response.use(
    (response) => {
        console.log(`[API Response] Status: ${response.status} | URL: ${response.config.url}`, response.data);
        return response;
    },
    (error) => {
        // Quietly pass 404 avatar requests without polluting the console
        if (error.response?.status === 404 && error.config?.url?.includes('/avatar')) {
            return Promise.reject(error);
        }

        const status = error.response?.status;
        const url = error.config?.url || '';
        const method = (error.config?.method || '').toUpperCase();

        let reason = "";
        const token = localStorage.getItem('token');
        if (status === 401) {
            reason = token ? "Token expired or invalid" : "Token missing";
        }

        // Console debug info
        console.error(`API Error [${method}] ${url} → ${status || 'Network Error'} | ${reason}`);

        // Show user-facing toasts for specific HTTP errors
        if (status === 404) {
            toast.error("Ma'lumot topilmadi (404)");
        } else if (status === 500) {
            toast.error("Server xatoligi (500). Keyinroq urinib ko'ring.");
        } else if (status === 401) {
            toast.error("Avtorizatsiya muddati tugadi. Qayta kiring.");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else if (status === 403) {
            toast.error("Ruxsat berilmagan so'rov (403).");
        } else if (!error.response) {
            // Network error (CORS, offline, etc.)
            toast.error("Tarmoq xatoligi. Internet aloqasini tekshiring.");
        }

        return Promise.reject(error);
    }
);

// Fetch user profile image via Telegram ID as a Blob
export const getUserAvatar = async (telegramId: number) => {
    return await api.get(`/api/users/telegram/${telegramId}/avatar`, {
        responseType: 'blob'
    });
};
