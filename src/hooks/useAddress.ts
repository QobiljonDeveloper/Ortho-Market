import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { toast } from "sonner";
import { useAuthContext } from "../context/AuthContext";

export interface Region {
    value: number;
    name: string;
}

export interface AddressPayload {
    userId: string;
    label: string;
    region: number;
    city: string;
    street: string;
    latitude?: number;
    longitude?: number;
    isDefault: boolean;
}

export interface AddressResponse extends AddressPayload {
    id: string;
}

export const useAddress = (userId?: string) => {
    const queryClient = useQueryClient();
    const { token } = useAuthContext();

    // Fetch Regions
    const { data: regions = [], isLoading: isLoadingRegions } = useQuery<Region[]>({
        queryKey: ["regions"],
        queryFn: async () => {
            const res = await api.get(`/api/enums/Region`);
            return res.data;
        },
        enabled: !!token,
    });

    // Fetch User Addresses
    const { data: addresses = [], isLoading: isLoadingAddresses } = useQuery<AddressResponse[]>({
        queryKey: ["addresses", userId],
        queryFn: async () => {
            if (!userId) return [];
            const res = await api.get(`/api/addresses/user/${userId}`);
            return res.data;
        },
        enabled: !!userId,
    });

    // Create Address
    const createAddressMutation = useMutation({
        mutationFn: async (payload: AddressPayload) => {
            const data = {
                userId: payload.userId,
                label: payload.label,
                region: Number(payload.region),
                city: payload.city,
                street: payload.street,
                latitude: payload.latitude ?? 41.2995,
                longitude: payload.longitude ?? 69.2401,
                isDefault: payload.isDefault,
            };


            // Bypass potential interceptor issues by using a explicit config
            const res = await api({
                method: 'post',
                url: '/api/addresses',
                data: JSON.stringify(data),
                withCredentials: false,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
            toast.success("Manzil muvaffaqiyatli saqlandi!");
        },
        onError: (err: any) => {
            console.error("=== ADDRESS POST FAILED ===");
            console.error("Error Message:", err?.message);
            console.error("Status:", err?.response?.status);
            console.error("Config URL:", err?.config?.url);
            console.error("Config Data:", err?.config?.data);
            console.error("Full Error:", err);
            toast.error("Manzilni saqlashda xatolik yuz berdi.");
        }
    });

    return {
        regions,
        isLoadingRegions,
        addresses,
        isLoadingAddresses,
        createAddress: createAddressMutation.mutateAsync,
        isCreatingAddress: createAddressMutation.isPending,
    };
};
