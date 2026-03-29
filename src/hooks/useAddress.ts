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
            const body = {
                dto: {
                    userId: payload.userId,
                    label: payload.label,
                    region: Number(payload.region),
                    city: payload.city,
                    street: payload.street,
                    isDefault: payload.isDefault,
                }
            };
            console.log("=== ADDRESS DEBUG === Sending body:", JSON.stringify(body));
            const res = await api.post(`/api/addresses`, JSON.stringify(body), {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
            toast.success("Manzil muvaffaqiyatli saqlandi!");
        },
        onError: (err: any) => {
            console.error("Failed to save address:", err);
            console.error("=== ADDRESS ERROR CONFIG ===", err?.config);
            console.error("=== ADDRESS ERROR REQUEST ===", err?.request);
            console.error("=== ADDRESS ERROR RESPONSE ===", err?.response);
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
