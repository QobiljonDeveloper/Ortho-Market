import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useAuthContext, User } from '../context/AuthContext';

interface AuthResponse {
    token: string;
    user: User;
}

export const useAuth = () => {
    const { setToken, setUser } = useAuthContext();

    return useMutation({
        mutationFn: async (initData: string): Promise<AuthResponse> => {
            const body = { initData };
            console.log("SENDING_TO_BACKEND:", body);
            const response = await api.post('/api/auth/telegram', body);
            return response.data;
        },
        onSuccess: (data) => {
            import('axios').then(axios => {
                axios.default.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            });
            api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            setToken(data.token);
            setUser(data.user);
            toast.success("Tizimga muvaffaqiyatli kirildi! ✅");
        },
        onError: (error: any) => {
            console.error("API Error:", error);
            toast.error("Avtorizatsiyadan o'tishda xatolik yuz berdi");
        }
    });
};
