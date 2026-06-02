import { createContext, useContext, ReactNode, useCallback, useState, useEffect, useMemo } from "react";
import type { Product, CartItem, SelectedTypeDetail } from "../types";
import { useAuthContext } from "./AuthContext";
import { useCartApi } from "../hooks/useCartApi";
import { useQueries } from "@tanstack/react-query";
import { fetchProductTypes, fetchProductById } from "../services/api";

interface VariantSelection {
    parentName?: string;
    parentPrice?: number;
    parentBasePrice?: number | null;
    parentDiscountPrice?: number | null;
    childName?: string;
    childPrice?: number;
    childBasePrice?: number | null;
    childDiscountPrice?: number | null;
    productTypeId?: string;
    selectedParentType?: SelectedTypeDetail | null;
    selectedChildType?: SelectedTypeDetail | null;
    selections?: {
        productTypeId: string | number;
        name: string;
        priceExtra: number;
        quantity: number;
    }[];
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (
        product: Product,
        selectedParentType?: SelectedTypeDetail | null,
        selectedChildType?: SelectedTypeDetail | null
    ) => void;
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

export function calculateCartItemTotal(item: CartItem, variantMap?: Record<string, any>): number {
    const basePrice = item.discountPrice !== undefined && item.discountPrice !== null && item.discountPrice < (item.basePrice || 0)
        ? item.discountPrice
        : (item.basePrice || item.unitPrice || 0);

    const variant = variantMap ? variantMap[String(item.productId)] : null;

    if (variant?.productTypeId === "multi" && Array.isArray(variant.selections)) {
        const selectionsTotal = variant.selections.reduce((sum: number, s: any) => {
            return sum + (s.quantity * (basePrice + (s.priceExtra || 0)));
        }, 0);
        return selectionsTotal * (item.quantity || 0);
    }

    const parentPrice = item.selectedParentType?.price || 0;
    const childPrice = item.selectedChildType?.price || 0;

    const unitPrice = basePrice + parentPrice + childPrice;
    return unitPrice * item.quantity;
}

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

    const hydratedCart = useMemo(() => {
        return safeCart.map((item: any) => {
            const variant = variantMap[String(item.productId)];
            
            let selectedParentType = variant?.selectedParentType || null;
            let selectedChildType = variant?.selectedChildType || null;

            // Re-hydrate details from flat properties if not stored explicitly
            if (!selectedParentType && variant?.parentName) {
                selectedParentType = {
                    id: variant.productTypeId || "",
                    name: variant.parentName,
                    price: variant.parentPrice || 0
                };
            }
            if (!selectedChildType && variant?.childName) {
                selectedChildType = {
                    id: variant.productTypeId || "",
                    name: variant.childName,
                    price: variant.childPrice || 0
                };
            }

            return {
                ...item,
                selectedParentType,
                selectedChildType
            };
        });
    }, [safeCart, variantMap]);

    const cartCount = useMemo(() => {
        return hydratedCart.reduce((total: number, item: any) => {
            const variant = variantMap[String(item.productId)];
            if (variant?.productTypeId === "multi" && Array.isArray(variant.selections) && variant.selections.length > 0) {
                const totalQty = variant.selections.reduce((sum: number, s: any) => sum + s.quantity, 0);
                return total + (totalQty * (item.quantity || 0));
            } else {
                return total + (item.quantity || 0);
            }
        }, 0);
    }, [hydratedCart, variantMap]);

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

    // Hydrate variant selection with full names/prices from fetched product types on mount/sync
    useEffect(() => {
        if (Object.keys(productTypesMap).length === 0) return;

        setVariantMap(prev => {
            let changed = false;
            const nextVariantMap = { ...prev };

            Object.keys(nextVariantMap).forEach((productId) => {
                const variant = nextVariantMap[productId];
                const fetchedTypes = productTypesMap[productId];
                if (!fetchedTypes || !Array.isArray(fetchedTypes)) return;

                if (variant.productTypeId === "multi" && Array.isArray(variant.selections)) {
                    // Hydrate multi-variant selections
                    const updatedSelections = variant.selections.map((sel: any) => {
                        let name = sel.name;
                        let priceExtra = sel.priceExtra;

                        for (const parent of fetchedTypes) {
                            if (String(parent.id) === String(sel.productTypeId)) {
                                name = parent.name;
                                priceExtra = parent.priceExtra || parent.price || 0;
                                break;
                            }
                            const childrenList = parent.children || parent.subTypes || [];
                            const child = childrenList.find((c: any) => String(c.id) === String(sel.productTypeId));
                            if (child) {
                                name = `${parent.name} ➔ ${child.name}`;
                                priceExtra = child.priceExtra || child.price || 0;
                                break;
                            }
                        }

                        if (sel.name !== name || sel.priceExtra !== priceExtra) {
                            changed = true;
                            return {
                                ...sel,
                                name,
                                priceExtra
                            };
                        }
                        return sel;
                    });

                    if (changed) {
                        nextVariantMap[productId] = {
                            ...variant,
                            selections: updatedSelections
                        };
                    }
                } else if (variant.productTypeId) {
                    // Hydrate flat/standard variant selections
                    let parentObj: any = null;
                    let childObj: any = null;

                    for (const parent of fetchedTypes) {
                        if (String(parent.id) === String(variant.productTypeId)) {
                            parentObj = parent;
                            break;
                        }
                        const childrenList = parent.children || parent.subTypes || [];
                        const child = childrenList.find((c: any) => String(c.id) === String(variant.productTypeId));
                        if (child) {
                            parentObj = parent;
                            childObj = child;
                            break;
                        }
                    }

                    if (parentObj) {
                        const parentName = parentObj.name;
                        const parentPrice = parentObj.price || 0;
                        const parentBasePrice = parentObj.basePrice || null;
                        const parentDiscountPrice = parentObj.discountPrice || null;
                        const childName = childObj ? childObj.name : null;
                        const childPrice = childObj ? (childObj.price || 0) : 0;
                        const childBasePrice = childObj ? (childObj.basePrice || null) : null;
                        const childDiscountPrice = childObj ? (childObj.discountPrice || null) : null;

                        const selectedParentType: SelectedTypeDetail = {
                            id: parentObj.id,
                            name: parentObj.name,
                            price: parentObj.price || parentObj.priceExtra || 0
                        };
                        const selectedChildType: SelectedTypeDetail | null = childObj ? {
                            id: childObj.id,
                            name: childObj.name,
                            price: childObj.price || childObj.priceExtra || 0
                        } : null;

                        if (
                            variant.parentName !== parentName ||
                            variant.parentPrice !== parentPrice ||
                            variant.parentBasePrice !== parentBasePrice ||
                            variant.parentDiscountPrice !== parentDiscountPrice ||
                            variant.childName !== childName ||
                            variant.childPrice !== childPrice ||
                            variant.childBasePrice !== childBasePrice ||
                            variant.childDiscountPrice !== childDiscountPrice ||
                            JSON.stringify(variant.selectedParentType) !== JSON.stringify(selectedParentType) ||
                            JSON.stringify(variant.selectedChildType) !== JSON.stringify(selectedChildType)
                        ) {
                            changed = true;
                            nextVariantMap[productId] = {
                                ...variant,
                                parentName,
                                parentPrice,
                                parentBasePrice,
                                parentDiscountPrice,
                                childName,
                                childPrice,
                                childBasePrice,
                                childDiscountPrice,
                                selectedParentType,
                                selectedChildType
                            };
                        }
                    }
                }
            });

            if (changed) {
                try {
                    localStorage.setItem(VARIANTS_STORAGE_KEY, JSON.stringify(nextVariantMap));
                } catch (err) {
                    console.error("Failed to write updated variants to localStorage:", err);
                }
                return nextVariantMap;
            }
            return prev;
        });
    }, [productTypesMap]);

    const getItemPrice = useCallback((productId: string) => {
        const item = safeCart.find((i: any) => String(i?.productId) === String(productId));
        if (!item) return 0;

        let price = item.unitPrice || item.basePrice || item.priceValue || item.price || 0;
        const variant = variantMap[String(productId)];
        if (variant) {
            price += (variant.parentPrice || 0) + (variant.childPrice || 0);
        }
        return price;
    }, [safeCart, variantMap]);

    const cartTotal = useMemo(() => {
        return hydratedCart.reduce((total: number, item: any) => {
            return total + calculateCartItemTotal(item, variantMap);
        }, 0);
    }, [hydratedCart, variantMap]);

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
        return variantMap[productId];
    }, [variantMap]);

    const addToCart = useCallback((
        product: Product,
        selectedParentType?: SelectedTypeDetail | null,
        selectedChildType?: SelectedTypeDetail | null
    ) => {
        if (!user?.id) {
            console.warn("Add to cart blocked: Missing user?.id");
            return;
        }
        if (!product || !product.id) {
            console.warn("Add to cart blocked: Missing product or product.id");
            return;
        }

        // Always sync with the latest localStorage first
        try {
            const saved = localStorage.getItem(VARIANTS_STORAGE_KEY);
            const currentVariants = saved ? JSON.parse(saved) : {};
            
            // If explicit types are passed, let's merge them
            if (selectedParentType || selectedChildType) {
                currentVariants[String(product.id)] = {
                    ...currentVariants[String(product.id)],
                    parentName: selectedParentType?.name || undefined,
                    parentPrice: selectedParentType?.price || 0,
                    childName: selectedChildType?.name || undefined,
                    childPrice: selectedChildType?.price || 0,
                    productTypeId: String(selectedChildType?.id || selectedParentType?.id || ""),
                    selectedParentType,
                    selectedChildType
                };
                localStorage.setItem(VARIANTS_STORAGE_KEY, JSON.stringify(currentVariants));
            }
            
            setVariantMap(currentVariants);
        } catch (err) {
            console.error("Error syncing variant map in addToCart:", err);
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
        const handleSync = () => {
            try {
                const saved = localStorage.getItem(VARIANTS_STORAGE_KEY);
                setVariantMap(saved ? JSON.parse(saved) : {});
            } catch (err) {
                console.error("Failed to parse variants in handleSync:", err);
            }
        };

        const handleStorage = (e: StorageEvent) => {
            if (e.key === VARIANTS_STORAGE_KEY) {
                handleSync();
            }
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('variantSaved', handleSync);
        
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('variantSaved', handleSync);
        };
    }, []);

    return (
        <CartContext.Provider
            value={{
                cart: hydratedCart,
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

