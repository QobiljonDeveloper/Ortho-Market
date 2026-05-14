import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Product, WishlistItem } from '../types';
import { toast } from 'sonner';

interface TogglePayload {
    productId: string;
    product: Product;
    isCurrentlySaved: boolean;
}

export const useWishlist = (userId: string | undefined | null) => {
    const queryClient = useQueryClient();
    const safeUserId = userId ? String(userId) : null;

    // Fetch wishlist
    const { data: wishlist = [], isLoading } = useQuery({
        queryKey: ['wishlist', safeUserId],
        queryFn: async (): Promise<WishlistItem[]> => {
            if (!safeUserId) return [];
            const { data } = await api.get(`/api/wishlist/${safeUserId}`);
            return data;
        },
        enabled: !!safeUserId,
    });

    // Check if a product is saved — match on productId field
    const isSaved = (productId: string) =>
        wishlist.some((item: WishlistItem) => item.productId === productId);

    // Toggle mutation
    const toggleMutation = useMutation({
        mutationFn: async ({ productId, isCurrentlySaved }: TogglePayload) => {
            if (!safeUserId) throw new Error("User not logged in");
            const url = `/api/wishlist/${safeUserId}/${productId}`;
            if (isCurrentlySaved) {
                await api.delete(url);
            } else {
                await api.post(url, null);
            }
        },
        onMutate: async ({ product, isCurrentlySaved }: TogglePayload) => {
            await queryClient.cancelQueries({ queryKey: ['wishlist', safeUserId] });
            const previousWishlist = queryClient.getQueryData<WishlistItem[]>(['wishlist', safeUserId]);

            if (previousWishlist) {
                if (isCurrentlySaved) {
                    queryClient.setQueryData<WishlistItem[]>(
                        ['wishlist', safeUserId],
                        previousWishlist.filter(p => p.productId !== product.id)
                    );
                } else {
                    // Create a temporary optimistic WishlistItem
                    const optimisticItem: WishlistItem = {
                        id: `temp-${product.id}`,
                        productId: product.id,
                        productNameUz: product.nameUz,
                        productNameRu: '',
                        slug: '',
                        basePrice: product.basePrice,
                        discountPrice: product.discountPrice,
                        primaryImageUrl: product.images?.[0]?.url || null,
                    };
                    queryClient.setQueryData<WishlistItem[]>(
                        ['wishlist', safeUserId],
                        [...previousWishlist, optimisticItem]
                    );
                }
            }
            return { previousWishlist };
        },
        onError: (err: any, _variables, context) => {
            console.error("=== WISHLIST DEBUG: Toggle Item ERROR ===", err?.response?.data || err);
            if (context?.previousWishlist) {
                queryClient.setQueryData(['wishlist', safeUserId], context.previousWishlist);
            }
            toast.error(err?.response?.data?.message || err?.message || "Xatolik yuz berdi");
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['wishlist', safeUserId] });
        },
    });

    // Remove mutation (for SavedDrawer trash button)
    const removeMutation = useMutation({
        mutationFn: async (productId: string) => {
            if (!safeUserId) throw new Error("User not logged in");
            const url = `/api/wishlist/${safeUserId}/${productId}`;
            await api.delete(url);
        },
        onMutate: async (productId: string) => {
            await queryClient.cancelQueries({ queryKey: ['wishlist', safeUserId] });
            const previousWishlist = queryClient.getQueryData<WishlistItem[]>(['wishlist', safeUserId]);
            if (previousWishlist) {
                queryClient.setQueryData<WishlistItem[]>(
                    ['wishlist', safeUserId],
                    previousWishlist.filter(p => p.productId !== productId)
                );
            }
            return { previousWishlist };
        },
        onError: (_err: any, _productId, context) => {
            if (context?.previousWishlist) {
                queryClient.setQueryData(['wishlist', safeUserId], context.previousWishlist);
            }
            toast.error("O'chirishda xatolik yuz berdi");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist', safeUserId] });
        },
    });

    return {
        wishlist,
        isLoading,
        isSaved,
        toggleWishlist: (product: Product) => {
            if (!safeUserId) return;
            toggleMutation.mutate({
                productId: product.id,
                product,
                isCurrentlySaved: isSaved(product.id),
            });
        },
        removeFromWishlist: (productId: string) => {
            if (!safeUserId) return;
            removeMutation.mutate(productId);
        },
    };
};
