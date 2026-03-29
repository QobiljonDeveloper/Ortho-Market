import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cartService';
import { Product, CartItem } from '../types';
import { toast } from 'sonner';

export const useCartApi = (userId: string | undefined | null) => {
    const queryClient = useQueryClient();
    const safeUserId = userId ? String(userId) : null;

    // Fetch cart
    const { data: cart = [], isLoading, refetch } = useQuery({
        queryKey: ['cart', safeUserId],
        queryFn: async (): Promise<CartItem[]> => {
            if (!safeUserId) return [];
            console.log(`Fetching cart for user: ${safeUserId}`);
            try {
                const data = await cartService.getCart(safeUserId);
                console.log("Cart data received:", data);
                // Xavfsizlik qatlami: array emas bo'lsa (masalan {items: []} obyekt kelsa), array ni ajratib olish
                const items = Array.isArray(data) ? data : (data as any)?.items || [];
                return items;
            } catch (error: any) {
                console.error("Error fetching cart data:", error);
                alert(`Cart fetch xatoligi: ${error?.message || error}`);
                throw error;
            }
        },
        enabled: !!safeUserId,
    });

    // Add to cart mutation
    const addToCartMutation = useMutation({
        mutationFn: async (product: Product) => {
            if (!safeUserId) throw new Error("User not logged in");
            console.log(`Adding product ${product.id} to cart...`);
            try {
                const data = await cartService.addToCart(safeUserId, product.id);
                console.log("Add to cart success:", data);
                return data;
            } catch (error: any) {
                console.error("Error adding product to cart:", error);
                alert(`Cart add xatoligi: ${error?.message || error}`);
                throw error;
            }
        },
        onMutate: async (product: Product) => {
            console.log("=== CART DEBUG: Add to Cart ===");
            console.log("-> UserId:", safeUserId);
            console.log("-> Product Payload:", product);
            await queryClient.cancelQueries({ queryKey: ['cart', safeUserId] });
            const previousData = queryClient.getQueryData<any>(['cart', safeUserId]);
            const previousCart: CartItem[] = Array.isArray(previousData) ? previousData : (previousData?.items || []);

            const existing = previousCart.find(item => item?.productId === product.id);
            if (existing) {
                queryClient.setQueryData<CartItem[]>(['cart', safeUserId],
                    previousCart.map(item =>
                        item?.productId === product.id
                            ? { ...item, quantity: (item.quantity || 0) + 1 }
                            : item
                    )
                );
            } else {
                const newItem: CartItem = {
                    id: `temp-${Date.now()}`,
                    productId: product.id,
                    productNameUz: product.nameUz || product.name || '',
                    unitPrice: product.basePrice || product.priceValue || 0,
                    basePrice: product.basePrice || product.priceValue || 0,
                    primaryImageUrl: product.primaryImageUrl || product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url || product.image || null,
                    quantity: 1
                };
                queryClient.setQueryData<CartItem[]>(['cart', safeUserId], [...previousCart, newItem]);
            }
            return { previousCart: previousData };
        },
        onError: (err: any, _product, context) => {
            console.error("=== CART DEBUG: Add to Cart ERROR ===", err?.response?.data || err);
            if (context?.previousCart) {
                queryClient.setQueryData(['cart', safeUserId], context.previousCart);
            }
            toast.error(err?.response?.data?.message || "Savatga qo'shishda xatolik");
            console.error("Add to cart error details:", err);
        },
        onSuccess: (data) => {
            console.log("=== CART DEBUG: Add to Cart SUCCESS ===", data);
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
                console.log(`Cart item ID is temporary (${cartItemId}), waiting for real ID from server...`);
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

            console.log(`Updating cart item ${finalCartItemId} to quantity: ${quantity}`);
            try {
                const data = await cartService.updateQuantity(safeUserId, finalCartItemId, quantity);
                console.log("Update quantity success:", data);
                return data;
            } catch (error: any) {
                console.error("Error updating cart item quantity:", error);
                throw error;
            }
        },
        onMutate: async ({ cartItemId, quantity }) => {
            console.log("=== CART DEBUG: Update Quantity ===");
            console.log("-> UserId:", safeUserId);
            console.log("-> CartItemId:", cartItemId, "| New Quantity:", quantity);
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
            console.log("=== CART DEBUG: Update Quantity SUCCESS ===", data);
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
                console.log(`Cart item ID is temporary (${cartItemId}), waiting for real ID from server...`);
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

            console.log(`Removing item ${finalCartItemId} from cart...`);
            try {
                const data = await cartService.removeCartItem(safeUserId, finalCartItemId);
                console.log("Remove cart item success:", data);
                return data;
            } catch (error: any) {
                console.error("Error removing cart item:", error);
                throw error;
            }
        },
        onMutate: async (cartItemId: string) => {
            console.log("=== CART DEBUG: Remove Item ===");
            console.log("-> UserId:", safeUserId);
            console.log("-> CartItemId:", cartItemId);
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
            console.log("=== CART DEBUG: Remove Item SUCCESS ===", data);
            toast.success("Savatdan o'chirildi");
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    return {
        cart,
        isLoading,
        refetch,
        addToCartMutation,
        updateQuantityMutation,
        removeCartItemMutation
    };
};
