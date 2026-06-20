import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cartService';
import { Product, CartItem } from '../types';
import { toast } from 'sonner';
import { getEffectivePrice } from '../utils/calculateTotal';

export const useCartApi = (userId: string | undefined | null) => {
    const queryClient = useQueryClient();
    const safeUserId = userId ? String(userId) : null;

    // Fetch cart
    const { data: cart = [], isLoading, isSuccess, refetch } = useQuery({
        queryKey: ['cart', safeUserId],
        queryFn: async (): Promise<CartItem[]> => {
            if (!safeUserId || safeUserId === 'undefined' || safeUserId === 'null') return [];
            try {
                const data = await cartService.getCart(safeUserId);
                // Xavfsizlik qatlami: array emas bo'lsa (masalan {items: []} obyekt kelsa), array ni ajratib olish
                const items = Array.isArray(data) ? data : (data as any)?.items || [];
                return items;
            } catch (error: any) {
                console.error("Error fetching cart data:", error);
                throw error;
            }
        },
        enabled: !!safeUserId && safeUserId !== 'undefined' && safeUserId !== 'null' && !!localStorage.getItem('token'),
    });

    // Add to cart mutation
    const addToCartMutation = useMutation({
        mutationFn: async ({ product, quantity }: { product: Product; quantity: number }) => {
            if (!safeUserId) throw new Error("User not logged in");
            try {
                const data = await cartService.addToCart(safeUserId, product.id, quantity);
                return data;
            } catch (error: any) {
                console.error("Error adding product to cart:", error);
                throw error;
            }
        },
        onMutate: async ({ product, quantity }: { product: Product; quantity: number }) => {
            await queryClient.cancelQueries({ queryKey: ['cart', safeUserId] });
            const previousData = queryClient.getQueryData<any>(['cart', safeUserId]);
            const previousCart: CartItem[] = Array.isArray(previousData) ? previousData : (previousData?.items || []);

            const existing = previousCart.find(item => item?.productId === product.id);
            if (existing) {
                queryClient.setQueryData<CartItem[]>(['cart', safeUserId],
                    previousCart.map(item =>
                        item?.productId === product.id
                            ? { ...item, quantity: (item.quantity || 0) + quantity }
                            : item
                    )
                );
            } else {
                const activePrice = getEffectivePrice(product.discountPrice, product.basePrice);

                const newItem: CartItem = {
                    id: `temp-${Date.now()}`,
                    productId: product.id,
                    productNameUz: product.nameUz || product.name || '',
                    unitPrice: activePrice || 0,
                    basePrice: product.basePrice || 0,
                    discountPrice: product.discountPrice,
                    primaryImageUrl: product.primaryImageUrl || product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url || product.image || null,
                    quantity: quantity
                };
                queryClient.setQueryData<CartItem[]>(['cart', safeUserId], [...previousCart, newItem]);
            }
            return { previousCart: previousData };
        },
        onError: (err: any, _vars, context) => {
            console.error("=== CART DEBUG: Add to Cart ERROR ===", err?.response?.data || err);
            if (context?.previousCart) {
                queryClient.setQueryData(['cart', safeUserId], context.previousCart);
            }
            toast.error(err?.response?.data?.message || "Savatga qo'shishda xatolik");
            console.error("Add to cart error details:", err);
        },
        onSuccess: (data) => {
            toast.success("Savatga qo'shildi");
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    // Update Quantity Mutation
    const updateQuantityMutation = useMutation({
        mutationFn: async ({ cartItemId, quantity }: { cartItemId: string, quantity: number }) => {
            if (!safeUserId) throw new Error("User not logged in");

            let finalCartItemId = cartItemId;

            if (cartItemId.startsWith('temp-')) {
                // Lookup local cache to map temp ID to actual product ID
                const cachedCart = queryClient.getQueryData<any>(['cart', safeUserId]);
                const items = Array.isArray(cachedCart) ? cachedCart : (cachedCart?.items || []);
                const tempItem = items.find((i: CartItem) => i.id === cartItemId);

                if (tempItem && tempItem.productId) {
                    // Refetch cart quietly to extract generated server UUID
                    const freshData = await queryClient.fetchQuery({ queryKey: ['cart', safeUserId] });
                    const freshItems: CartItem[] = Array.isArray(freshData) ? freshData : (freshData as any)?.items || [];
                    const realItem = freshItems.find((i: CartItem) => i.productId === tempItem.productId);

                    if (realItem && !realItem.id.startsWith('temp-')) {
                        finalCartItemId = realItem.id;
                    } else {
                        throw new Error("Tizim sinxronlashmoqda, iltimos biroz kuting va qayta urining.");
                    }
                } else {
                    throw new Error("Tarmoq ma'lumotlari yangilanmadi.");
                }
            }

            try {
                const data = await cartService.updateQuantity(safeUserId, finalCartItemId, quantity);
                return data;
            } catch (error: any) {
                console.error("Error updating cart item quantity:", error);
                throw error;
            }
        },
        onMutate: async ({ cartItemId, quantity }) => {
            await queryClient.cancelQueries({ queryKey: ['cart', safeUserId] });
            const previousData = queryClient.getQueryData<any>(['cart', safeUserId]);
            const previousCart: CartItem[] = Array.isArray(previousData) ? previousData : (previousData?.items || []);

            queryClient.setQueryData<CartItem[]>(['cart', safeUserId],
                previousCart.map(item =>
                    item?.id === cartItemId
                        ? { ...item, quantity }
                        : item
                )
            );
            return { previousCart: previousData };
        },
        onError: (err: any, _vars, context) => {
            console.error("=== CART DEBUG: Update Quantity ERROR ===", err?.response?.data || err);
            if (context?.previousCart) {
                queryClient.setQueryData(['cart', safeUserId], context.previousCart);
            }
            toast.error(err?.response?.data?.message || "Miqdorni o'zgartirishda xatolik");
            console.error("Update quantity error details:", err);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    // Remove Item Mutation
    const removeCartItemMutation = useMutation({
        mutationFn: async (cartItemId: string) => {
            if (!safeUserId) throw new Error("User not logged in");

            let finalCartItemId = cartItemId;

            if (cartItemId.startsWith('temp-')) {
                // Lookup local cache to map temp ID to actual product ID
                const cachedCart = queryClient.getQueryData<any>(['cart', safeUserId]);
                const items = Array.isArray(cachedCart) ? cachedCart : (cachedCart?.items || []);
                const tempItem = items.find((i: CartItem) => i.id === cartItemId);

                if (tempItem && tempItem.productId) {
                    const freshData = await queryClient.fetchQuery({ queryKey: ['cart', safeUserId] });
                    const freshItems: CartItem[] = Array.isArray(freshData) ? freshData : (freshData as any)?.items || [];
                    const realItem = freshItems.find((i: CartItem) => i.productId === tempItem.productId);

                    if (realItem && !realItem.id.startsWith('temp-')) {
                        finalCartItemId = realItem.id;
                    } else {
                        // Avoid crashing if they try deleting an item that hasn't saved yet
                        return { status: "deleted_locally_before_sync" };
                    }
                } else {
                    return { status: "deleted_locally_before_sync" };
                }
            }

            try {
                const data = await cartService.removeCartItem(safeUserId, finalCartItemId);
                return data;
            } catch (error: any) {
                console.error("Error removing cart item:", error);
                throw error;
            }
        },
        onMutate: async (cartItemId: string) => {
            await queryClient.cancelQueries({ queryKey: ['cart', safeUserId] });
            const previousData = queryClient.getQueryData<any>(['cart', safeUserId]);
            const previousCart: CartItem[] = Array.isArray(previousData) ? previousData : (previousData?.items || []);

            queryClient.setQueryData<CartItem[]>(['cart', safeUserId],
                previousCart.filter(item => item?.id !== cartItemId)
            );
            return { previousCart: previousData };
        },
        onError: (err: any, _vars, context) => {
            console.error("=== CART DEBUG: Remove Item ERROR ===", err?.response?.data || err);
            if (context?.previousCart) {
                queryClient.setQueryData(['cart', safeUserId], context.previousCart);
            }
            toast.error(err?.response?.data?.message || "O'chirishda xatolik");
            console.error("Remove cart item error details:", err);
        },
        onSuccess: (data) => {
            toast.success("Savatdan o'chirildi");
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    return {
        cart,
        isLoading,
        isSuccess,
        refetch,
        addToCartMutation,
        updateQuantityMutation,
        removeCartItemMutation
    };
};
