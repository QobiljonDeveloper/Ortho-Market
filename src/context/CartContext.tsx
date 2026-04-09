import { createContext, useContext, ReactNode, useCallback, useState } from "react";
import type { Product, CartItem } from "../types";
import { useAuthContext } from "./AuthContext";
import { useCartApi } from "../hooks/useCartApi";

interface VariantSelection {
    parentName: string;
    childName?: string;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getItemQuantity: (productId: string) => number;
    cartTotal: number;
    cartCount: number;
    refetchCart: () => void;
    setVariantForItem: (productId: string, parentName: string, childName?: string) => void;
    getVariantForItem: (productId: string) => VariantSelection | undefined;
    variantMap: Record<string, VariantSelection>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { user } = useAuthContext();
    const { cart, refetch, addToCartMutation, updateQuantityMutation, removeCartItemMutation } = useCartApi(user?.id);

    // Client-side variant selection storage (not persisted to backend cart)
    const [variantMap, setVariantMap] = useState<Record<string, VariantSelection>>({});

    // Xavfsizlik qatlami: cart doim massiv ekanligiga ishonch hosil qilish
    const safeCart = Array.isArray(cart) ? cart : (cart as any)?.items || [];

    const cartCount = safeCart.length;
    const cartTotal = safeCart.reduce(
        (total: number, item: any) => total + ((item?.unitPrice || item?.basePrice || item?.priceValue || item?.price || 0) * (item?.quantity || 0)),
        0
    );

    const getItemQuantity = useCallback((productId: string) => {
        if (!productId) return 0;
        const item = safeCart.find((item: any) => item?.productId === productId);
        return item ? item.quantity : 0;
    }, [safeCart]);

    const setVariantForItem = useCallback((productId: string, parentName: string, childName?: string) => {
        setVariantMap(prev => ({
            ...prev,
            [productId]: { parentName, childName }
        }));
    }, []);

    const getVariantForItem = useCallback((productId: string): VariantSelection | undefined => {
        return variantMap[productId];
    }, [variantMap]);

    const addToCart = useCallback((product: Product) => {
        if (!user?.id) {
            console.warn("Add to cart blocked: Missing user?.id");
            return;
        }
        if (!product || !product.id) {
            console.warn("Add to cart blocked: Missing product or product.id");
            return;
        }
        try {
            if (addToCartMutation && typeof addToCartMutation.mutate === 'function') {
                addToCartMutation.mutate(product);
            } else {
                console.error("addToCartMutation is undefined or uninitialized");
            }
        } catch (err) {
            console.error("Error executing addToCart mutation:", err);
        }
    }, [addToCartMutation, user?.id]);

    const removeFromCart = useCallback((productId: string) => {
        if (!user?.id || !productId) return;
        try {
            const item = safeCart.find((i: any) => i?.productId === productId);
            if (item) {
                removeCartItemMutation.mutate(item.id);
                // Clean up variant selection
                setVariantMap(prev => {
                    const next = { ...prev };
                    delete next[productId];
                    return next;
                });
            }
        } catch (err) {
            console.error("Error executing removeFromCart mutation:", err);
        }
    }, [user?.id, safeCart, removeCartItemMutation]);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        if (!user?.id || !productId) return;
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            const item = safeCart.find((i: any) => i?.productId === productId);
            if (item) {
                updateQuantityMutation.mutate({ cartItemId: item.id, quantity });
            } else if (quantity === 1) {
                // Failsafe in case product isn't mapped but update was fired
            }
        }
    }, [user?.id, safeCart, removeFromCart, updateQuantityMutation]);

    const clearCart = useCallback(() => {
        // Typically a loop removing everything, or better a dedicated backend endpoint.
        // The prompt didn't request a clearCart endpoint, so skipping it.
        console.warn("Backend clear cart endpoint not yet configured.");
        setVariantMap({});
    }, []);

    return (
        <CartContext.Provider
            value={{
                cart: safeCart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartTotal,
                cartCount,
                getItemQuantity,
                refetchCart: refetch,
                setVariantForItem,
                getVariantForItem,
                variantMap,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}

