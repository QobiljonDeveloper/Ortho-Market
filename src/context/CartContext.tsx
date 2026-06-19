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

        selectedChildType?: SelectedTypeDetail | null,

        quantity?: number

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

        // Each selection already carries its own quantity — do NOT multiply

        // by item.quantity again, as that would double-count.

        return variant.selections.reduce((sum: number, s: any) => {

            return sum + (s.quantity * (basePrice + (s.priceExtra || 0)));

        }, 0);

    }



    const parentPrice = item.selectedParentType?.price || 0;

    const childPrice = item.selectedChildType?.price || 0;



    const unitPrice = basePrice + parentPrice + childPrice;

    return unitPrice * item.quantity;

}



export function CartProvider({ children }: { children: ReactNode }) {

    const { user } = useAuthContext();

    const { cart: apiCart, isLoading: isCartLoading, isSuccess: isCartSuccess, refetch, addToCartMutation, updateQuantityMutation, removeCartItemMutation } = useCartApi(user?.id);



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



    // Client-side cart items state (including separate variants)

    const [clientCart, setClientCart] = useState<CartItem[]>(() => {

        try {

            const saved = localStorage.getItem('tg_cart_client_items');

            return saved ? JSON.parse(saved) : [];

        } catch {

            return [];

        }

    });



    // Synchronize clientCart quantities with the server cart.
    // RULES:
    //   1. NEVER delete or overwrite existing client items that have variant data.
    //   2. NEVER run when server cart is empty (empty server != user has no items).
    //   3. ONLY update quantities on existing items; never strip selectedParentType/selectedChildType.
    useEffect(() => {
        if (!user?.id || !isCartSuccess || isCartLoading) return;

        const safeApiCart = Array.isArray(apiCart) ? apiCart : (apiCart as any)?.items || [];

        // If server returned empty, do nothing. localStorage is source of truth.
        if (safeApiCart.length === 0) return;

        setClientCart(prev => {
            // If client cart is empty, nothing to reconcile.
            if (prev.length === 0) return prev;

            // Build a lookup of totalClientQty per productId
            const clientQtyByProduct: Record<string, number> = {};
            prev.forEach(item => {
                clientQtyByProduct[item.productId] = (clientQtyByProduct[item.productId] || 0) + item.quantity;
            });

            // Check if any server quantities differ from client quantities
            let hasChanges = false;
            const serverQtyByProduct: Record<string, number> = {};
            safeApiCart.forEach((apiItem: any) => {
                serverQtyByProduct[apiItem.productId] = apiItem.quantity || 0;
            });

            for (const productId of Object.keys(serverQtyByProduct)) {
                const clientQty = clientQtyByProduct[productId];
                const serverQty = serverQtyByProduct[productId];
                if (clientQty !== undefined && clientQty !== serverQty) {
                    hasChanges = true;
                    break;
                }
            }

            // If quantities all match, skip entirely to avoid unnecessary re-renders
            if (!hasChanges) return prev;

            // Reconcile: ONLY adjust quantities on existing items. Never remove, never strip variants.
            const updated = prev.map(item => {
                const serverQty = serverQtyByProduct[item.productId];
                if (serverQty === undefined) {
                    // Server does not know this product yet — keep client item untouched
                    return item;
                }

                const clientTotalForProduct = clientQtyByProduct[item.productId] || 0;
                if (clientTotalForProduct === serverQty) {
                    // Perfect match for this product — keep item exactly as-is (preserves variants)
                    return item;
                }

                // Quantity mismatch: scale this item proportionally.
                // We keep all variant fields by spreading the existing item.
                const ratio = clientTotalForProduct > 0 ? item.quantity / clientTotalForProduct : 1;
                const newQty = Math.max(1, Math.round(serverQty * ratio));
                return { ...item, quantity: newQty };
            });

            // Persist the reconciled cart (quantities updated, variants fully preserved)
            try {
                localStorage.setItem('tg_cart_client_items', JSON.stringify(updated));
            } catch (err) {
                console.error('Failed to save synced cart to localStorage:', err);
            }
            return updated;
        });
    }, [apiCart, isCartLoading, isCartSuccess, user?.id]);



    const safeCart = Array.isArray(apiCart) ? apiCart : (apiCart as any)?.items || [];



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

        const items = clientCart.filter(item => item.productId === productId);

        if (items.length === 0) return 0;

        

        const item = items[0];

        const basePrice = item.discountPrice !== undefined && item.discountPrice !== null && item.discountPrice < (item.basePrice || 0)

            ? item.discountPrice

            : (item.basePrice || item.unitPrice || 0);



        const parentPrice = item.selectedParentType?.price || 0;

        const childPrice = item.selectedChildType?.price || 0;

        return basePrice + parentPrice + childPrice;

    }, [clientCart]);



    const cartTotal = useMemo(() => {

        return clientCart.reduce((total, item) => {

            // Delegate to the shared pure function so multi-variant

            // items are calculated consistently without double-counting.

            return total + calculateCartItemTotal(item, variantMap);

        }, 0);

    }, [clientCart, variantMap]);



    const cartCount = useMemo(() => {

        return clientCart.reduce((total, item) => total + (item.quantity || 0), 0);

    }, [clientCart]);



    const getItemQuantity = useCallback((productId: string) => {

        if (!productId) return 0;

        return clientCart

            .filter(item => item.productId === productId)

            .reduce((sum, item) => sum + item.quantity, 0);

    }, [clientCart]);



    const setVariantForItem = useCallback((productId: string, parentName: string, childName?: string) => {

        setVariantMap(prev => {

            const next = { ...prev };

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

        selectedChildType?: SelectedTypeDetail | null,

        quantity: number = 1

    ) => {

        if (!user?.id) {

            console.warn("Add to cart blocked: Missing user?.id");

            return;

        }

        if (!product || !product.id) {

            console.warn("Add to cart blocked: Missing product or product.id");

            return;

        }



        const basePrice = product.discountPrice !== undefined && product.discountPrice !== null && product.discountPrice < product.basePrice

            ? product.discountPrice

            : product.basePrice;



        // Check if there is a multi-variant selection saved in localStorage for this product

        let multiSelections: any[] = [];

        try {

            const savedVariants = localStorage.getItem('tg_cart_variants');

            const variantsMap = savedVariants ? JSON.parse(savedVariants) : {};

            const saved = variantsMap[product.id];

            if (saved && saved.productTypeId === "multi" && Array.isArray(saved.selections)) {

                multiSelections = saved.selections;

            }

        } catch (err) {

            console.error("Failed to load multi variants in addToCart:", err);

        }



        if (multiSelections.length > 0) {

            setClientCart(prev => {

                // Remove existing client items for this product

                const nextCart = prev.filter(item => item.productId !== product.id);

                

                multiSelections.forEach(sel => {

                    const hasSub = sel.name.includes(" ➔ ");

                    let parentType: SelectedTypeDetail | null = null;

                    let childType: SelectedTypeDetail | null = null;

                    let parentId = '';

                    let childId = '';



                    if (hasSub) {

                        const parts = sel.name.split(" ➔ ");

                        parentId = 'parent';

                        childId = String(sel.productTypeId);

                        parentType = { id: parentId, name: parts[0], price: 0 };

                        childType = { id: childId, name: parts[1], price: sel.priceExtra || 0 };

                    } else {

                        parentId = String(sel.productTypeId);

                        parentType = { id: parentId, name: sel.name, price: sel.priceExtra || 0 };

                    }



                    const compositeKey = `${product.id}-${parentId}-${childId}`;

                    const unitPrice = basePrice + (sel.priceExtra || 0);



                    nextCart.push({

                        id: compositeKey,

                        productId: product.id,

                        productNameUz: product.nameUz || product.name || '',

                        quantity: sel.quantity || 1,

                        unitPrice: unitPrice,

                        basePrice: product.basePrice,

                        discountPrice: product.discountPrice,

                        primaryImageUrl: product.primaryImageUrl || product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url || product.image || null,

                        selectedParentType: parentType,

                        selectedChildType: childType

                    });

                });



                try {

                    localStorage.setItem('tg_cart_client_items', JSON.stringify(nextCart));

                } catch (err) {

                    console.error("Failed to save cart to localStorage:", err);

                }

                return nextCart;

            });

        } else {

            // Flat / single variant selection

            let finalParent = selectedParentType;

            let finalChild = selectedChildType;



            if (!finalParent && !finalChild) {

                try {

                    const savedVariants = localStorage.getItem('tg_cart_variants');

                    const variantsMap = savedVariants ? JSON.parse(savedVariants) : {};

                    const saved = variantsMap[product.id];

                    if (saved && saved.productTypeId !== "multi") {

                        if (saved.selectedParentType) {

                            finalParent = saved.selectedParentType;

                        } else if (saved.parentName) {

                            finalParent = {

                                id: saved.productTypeId || '',

                                name: saved.parentName,

                                price: saved.parentPrice || 0

                            };

                        }

                        if (saved.selectedChildType) {

                            finalChild = saved.selectedChildType;

                        } else if (saved.childName) {

                            finalChild = {

                                id: saved.productTypeId || '',

                                name: saved.childName,

                                price: saved.childPrice || 0

                            };

                        }

                    }

                } catch (err) {

                    console.error("Failed to load options from local storage in addToCart:", err);

                }

            }



            const parentId = finalParent?.id ? String(finalParent.id) : '';

            const childId = finalChild?.id ? String(finalChild.id) : '';

            const compositeKey = `${product.id}-${parentId}-${childId}`;



            const parentPrice = finalParent?.price || 0;

            const childPrice = finalChild?.price || 0;

            const unitPrice = basePrice + parentPrice + childPrice;



            setClientCart(prev => {

                const nextCart = [...prev];

                const existingIdx = nextCart.findIndex(item => item.id === compositeKey);



                if (existingIdx > -1) {

                    nextCart[existingIdx] = {

                        ...nextCart[existingIdx],

                        quantity: nextCart[existingIdx].quantity + quantity

                    };

                } else {

                    const newItem: CartItem = {

                        id: compositeKey,

                        productId: product.id,

                        productNameUz: product.nameUz || product.name || '',

                        quantity: quantity,

                        unitPrice: unitPrice,

                        basePrice: product.basePrice,

                        discountPrice: product.discountPrice,

                        primaryImageUrl: product.primaryImageUrl || product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url || product.image || null,

                        selectedParentType: finalParent || null,

                        selectedChildType: finalChild || null

                    };

                    nextCart.push(newItem);

                }



                try {

                    localStorage.setItem('tg_cart_client_items', JSON.stringify(nextCart));

                } catch (err) {

                    console.error("Failed to save cart to localStorage:", err);

                }

                return nextCart;

            });

        }



        // Trigger backend API call

        try {

            if (addToCartMutation && typeof addToCartMutation.mutate === 'function') {

                addToCartMutation.mutate({ product, quantity });

            }

        } catch (err) {

            console.error("Error executing addToCart mutation:", err);

        }

    }, [addToCartMutation, user?.id]);



    const removeFromCart = useCallback((compositeKey: string) => {

        if (!user?.id || !compositeKey) return;

        setClientCart(prev => {

            const nextCart = [...prev];

            const idx = nextCart.findIndex(item => item.id === compositeKey);

            

            let productId = '';

            if (idx > -1) {

                productId = nextCart[idx].productId;

                nextCart.splice(idx, 1);

            } else {

                productId = compositeKey;

                const filtered = nextCart.filter(item => item.productId !== productId);

                if (filtered.length === nextCart.length) return prev;

                nextCart.length = 0;

                nextCart.push(...filtered);

            }



            try {

                localStorage.setItem('tg_cart_client_items', JSON.stringify(nextCart));

            } catch (err) {

                console.error("Failed to save updated cart to localStorage:", err);

            }



            // Sync with backend

            const remainingQty = nextCart

                .filter(i => i.productId === productId)

                .reduce((sum, i) => sum + i.quantity, 0);



            const safeApiCart = Array.isArray(apiCart) ? apiCart : (apiCart as any)?.items || [];

            const apiItem = safeApiCart.find((i: any) => i.productId === productId);



            if (apiItem) {

                if (remainingQty === 0) {

                    removeCartItemMutation.mutate(apiItem.id);

                } else {

                    updateQuantityMutation.mutate({ cartItemId: apiItem.id, quantity: remainingQty });

                }

            }



            return nextCart;

        });

    }, [apiCart, user?.id, removeCartItemMutation, updateQuantityMutation]);



    const updateQuantity = useCallback((keyOrId: string, quantity: number) => {

        if (!user?.id || !keyOrId) return;



        setClientCart(prev => {

            const nextCart = [...prev];

            let idx = nextCart.findIndex(item => item.id === keyOrId);

            

            if (idx === -1) {

                const items = nextCart.filter(i => i.productId === keyOrId);

                if (items.length > 0) {

                    const currentSum = items.reduce((sum, i) => sum + i.quantity, 0);

                    if (currentSum === quantity) {

                        return prev;

                    }

                    const firstItem = items[0];

                    const firstIdx = nextCart.findIndex(i => i.id === firstItem.id);

                    const otherQty = items.slice(1).reduce((sum, i) => sum + i.quantity, 0);

                    const newFirstQty = Math.max(0, quantity - otherQty);

                    

                    if (newFirstQty === 0) {

                        nextCart.splice(firstIdx, 1);

                    } else {

                        nextCart[firstIdx] = {

                            ...firstItem,

                            quantity: newFirstQty

                        };

                    }

                    

                    const remainingQty = nextCart

                        .filter(i => i.productId === keyOrId)

                        .reduce((sum, i) => sum + i.quantity, 0);



                    const safeApiCart = Array.isArray(apiCart) ? apiCart : (apiCart as any)?.items || [];

                    const apiItem = safeApiCart.find((i: any) => i.productId === keyOrId);



                    if (apiItem) {

                        if (remainingQty === 0) {

                            removeCartItemMutation.mutate(apiItem.id);

                        } else {

                            updateQuantityMutation.mutate({ cartItemId: apiItem.id, quantity: remainingQty });

                        }

                    }

                    

                    try {

                        localStorage.setItem('tg_cart_client_items', JSON.stringify(nextCart));

                    } catch (err) {

                        console.error("Failed to save updated cart to localStorage:", err);

                    }

                    return nextCart;

                }

                return prev;

            }



            const item = nextCart[idx];

            const newQty = Math.max(0, quantity);



            if (newQty === 0) {

                nextCart.splice(idx, 1);

            } else {

                nextCart[idx] = {

                    ...item,

                    quantity: newQty

                };

            }



            try {

                localStorage.setItem('tg_cart_client_items', JSON.stringify(nextCart));

            } catch (err) {

                console.error("Failed to save updated cart to localStorage:", err);

            }



            const remainingQty = nextCart

                .filter(i => i.productId === item.productId)

                .reduce((sum, i) => sum + i.quantity, 0);



            const safeApiCart = Array.isArray(apiCart) ? apiCart : (apiCart as any)?.items || [];

            const apiItem = safeApiCart.find((i: any) => i.productId === item.productId);



            if (apiItem) {

                if (remainingQty === 0) {

                    removeCartItemMutation.mutate(apiItem.id);

                } else {

                    updateQuantityMutation.mutate({ cartItemId: apiItem.id, quantity: remainingQty });

                }

            }



            return nextCart;

        });

    }, [apiCart, user?.id, removeCartItemMutation, updateQuantityMutation]);



    const clearCart = useCallback(() => {

        setClientCart([]);

        localStorage.removeItem('tg_cart_client_items');

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

                cart: clientCart,

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



