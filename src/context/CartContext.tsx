import { createContext, useContext, ReactNode, useCallback, useState, useEffect, useMemo } from "react";
import type { Product, CartItem } from "../types";
import { useAuthContext } from "./AuthContext";
import { useCartApi } from "../hooks/useCartApi";
import { useQueries } from "@tanstack/react-query";
import { fetchProductTypes, fetchProductById } from "../services/api";

interface VariantSelection {
    parentName: string;
    parentPrice?: number;
    childName?: string;
    childPrice?: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getItemQuantity: (productId: string) => number;
    getItemPrice: (productId: string) => number;
    cartTotal: number;
    cartCount: number;
    refetchCart: () => void;
    setVariantForItem: (productId: string, parentName: string, childName?: string) => void;
    getVariantForItem: (productId: string) => VariantSelection | undefined;
    variantMap: Record<string, VariantSelection>;
    productTypesMap: Record<string, any[]>;
    productsMap: Record<string, Product>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const VARIANTS_STORAGE_KEY = 'tg_cart_variants';

export function CartProvider({ children }: { children: ReactNode }) {
    const { user } = useAuthContext();
    const { cart, refetch, addToCartMutation, updateQuantityMutation, removeCartItemMutation } = useCartApi(user?.id);

    // Client-side variant selection storage persisted to localStorage
    const [variantMap, setVariantMap] = useState<Record<string, VariantSelection>>(() => {
        try {
            const saved = localStorage.getItem(VARIANTS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch (err) {
            console.error("Failed to parse variants from localStorage:", err);
            return {};
        }
    });

    const safeCart = Array.isArray(cart) ? cart : (cart as any)?.items || [];

    const cartCount = safeCart.length;

    const productIds: string[] = useMemo(() => Array.from(new Set(safeCart.map((i: any) => String(i.productId)))), [safeCart]);

    const typeQueries = useQueries({
        queries: productIds.map(id => ({
            queryKey: ['product-types', id],
            queryFn: () => fetchProductTypes(id),
            staleTime: 1000 * 60 * 5,
        }))
    });

    const productQueries = useQueries({
        queries: productIds.map(id => ({
            queryKey: ['product-details-cart', id],
            queryFn: () => fetchProductById(id),
            staleTime: 1000 * 60 * 5,
        }))
    });

    const productTypesMap = useMemo(() => {
        const map: Record<string, any[]> = {};
        typeQueries.forEach((q, idx) => {
            if (q.data) map[productIds[idx]] = q.data;
        });
        return map;
    }, [typeQueries, productIds]);

    const productsMap = useMemo(() => {
        const map: Record<string, Product> = {};
        productQueries.forEach((q, idx) => {
            if (q.data) map[productIds[idx]] = q.data;
        });
        return map;
    }, [productQueries, productIds]);

    const getItemPrice = useCallback((productId: string) => {
        const item = safeCart.find((i: any) => String(i?.productId) === String(productId));
        if (!item) return 0;

        let basePrice = item.unitPrice || item.basePrice || item.priceValue || item.price || 0;
        const lookupKey = Object.keys(variantMap).find(k => k.toLowerCase() === String(productId).toLowerCase());
        const variant = lookupKey ? variantMap[lookupKey] : undefined;
        
        if (variant) {
            if (variant.productTypeId === "multi" && Array.isArray(variant.selections) && variant.selections.length > 0) {
                const totalQty = variant.selections.reduce((sum: number, sel: any) => sum + (sel.quantity || 0), 0);
                if (totalQty > 0) {
                    const totalPrice = variant.selections.reduce((sum: number, sel: any) => {
                        const selPrice = basePrice + (sel.priceExtra || 0);
                        return sum + (selPrice * (sel.quantity || 0));
                    }, 0);
                    return totalPrice / totalQty;
                }
            } else {
                return basePrice + (variant.parentPrice || 0) + (variant.childPrice || 0);
            }
        }
        return basePrice;
    }, [safeCart, variantMap]);

    const cartTotal = useMemo(() => {
        return safeCart.reduce((total: number, item: any) => {
            return total + (getItemPrice(item.productId) * (item.quantity || 0));
        }, 0);
    }, [safeCart, getItemPrice]);

    const getItemQuantity = useCallback((productId: string) => {
        if (!productId) return 0;
        const item = safeCart.find((item: any) => item?.productId === productId);
        return item ? item.quantity : 0;
    }, [safeCart]);

    const setVariantForItem = useCallback((productId: string, parentName: string, childName?: string) => {
        setVariantMap(prev => {
            const next = { ...prev };

            // If parentName is empty, it means "clear selection"
            if (!parentName) {
                delete next[productId];
            } else {
                next[String(productId)] = { parentName, parentPrice: 0, childName, childPrice: 0 };
            }

            localStorage.setItem(VARIANTS_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const getVariantForItem = useCallback((productId: string): VariantSelection | undefined => {
        const lookupKey = Object.keys(variantMap).find(k => k.toLowerCase() === String(productId).toLowerCase());
        return lookupKey ? variantMap[lookupKey] : undefined;
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
                    if (next[productId]) {
                        delete next[productId];
                        localStorage.setItem(VARIANTS_STORAGE_KEY, JSON.stringify(next));
                    }
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
        console.warn("Backend clear cart endpoint not yet configured.");
        setVariantMap({});
        localStorage.removeItem(VARIANTS_STORAGE_KEY);
    }, []);

    // Listen for cross-tab or direct localStorage updates
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === VARIANTS_STORAGE_KEY) {
                try {
                    setVariantMap(e.newValue ? JSON.parse(e.newValue) : {});
                } catch {
                    // Ignore parsing errors
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
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
                getItemPrice,
                refetchCart: refetch,
                setVariantForItem,
                getVariantForItem,
                variantMap,
                productTypesMap,
                productsMap,
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

