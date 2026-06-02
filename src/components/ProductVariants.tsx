"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useProductVariants } from "../hooks/useProductVariants";

interface ProductVariantsProps {
    productId: string | number;
    initialSelectedOptions?: Record<string, string>;
    onOptionChange?: (selected: Record<string, string>) => void;
    onPriceChange?: (extraPrice: number) => void;
    className?: string;
}

interface VariantItem {
    id: number;
    name: string;
    stock?: number;
    logoUrl?: string;
    price?: number | null;
    basePrice?: number | null;
    discountPrice?: number | null;
    children?: VariantItem[];
}

export function ProductVariants({
    productId,
    onOptionChange,
    onPriceChange,
    className,
}: ProductVariantsProps) {
    const { data: productTypes = [], isLoading } = useProductVariants(productId);
    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

    // Add initialization flag to prevent wiping variant on first load
    const [isInitialized, setIsInitialized] = useState(false);

    const VARIANTS_KEY = 'tg_cart_variants';

    // 1. Initialize from LocalStorage
    useEffect(() => {
        if (!isLoading && productTypes.length > 0 && !isInitialized) {
            const saved = localStorage.getItem(VARIANTS_KEY);
            if (saved) {
                const existingData = JSON.parse(saved);
                const currentVariant = existingData[productId];

                if (currentVariant && currentVariant.parentName) {
                    const parent = (productTypes as VariantItem[]).find(p => p.name === currentVariant.parentName);
                    if (parent) {
                        setSelectedParentId(parent.id);
                        if (currentVariant.childName) {
                            const child = parent.children?.find(c => c.name === currentVariant.childName);
                            if (child) setSelectedChildId(child.id);
                        }
                    }
                }
            }
            setIsInitialized(true);
        }
    }, [isLoading, productTypes, productId, isInitialized]);

    // 2. Sync to LocalStorage requested by user
    useEffect(() => {
        // Do not sync if not fully initialized yet
        if (!isInitialized) return;

        const saved = localStorage.getItem(VARIANTS_KEY);
        const existingData = saved ? JSON.parse(saved) : {};

        if (selectedParentId) {
            // Find the selected parent object
            const parent = (productTypes as VariantItem[]).find(p => p.id === selectedParentId);
            // Find the selected child object (if any)
            const child = parent?.children?.find(c => c.id === selectedChildId);

            if (parent) {
                existingData[productId] = {
                    parentName: parent.name,
                    parentPrice: parent.price || 0,
                    parentBasePrice: parent.basePrice || null,
                    parentDiscountPrice: parent.discountPrice || null,
                    childName: child?.name || null,
                    childPrice: child?.price || 0,
                    childBasePrice: child?.basePrice || null,
                    childDiscountPrice: child?.discountPrice || null,
                    productTypeId: child?.id || parent.id
                };
                localStorage.setItem(VARIANTS_KEY, JSON.stringify(existingData));
                // Fire storage event manually so CartContext updates in real-time
                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new Event('variantSaved'));
            }
        } else {
            // Handling Unselection - only delete if it exists and is NOT a multi-variant configuration
            const currentItem = existingData[productId];
            if (currentItem && currentItem.productTypeId !== "multi") {
                delete existingData[productId];
                localStorage.setItem(VARIANTS_KEY, JSON.stringify(existingData));
                // Fire storage event manually so CartContext updates in real-time
                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new Event('variantSaved'));
            }
        }
    }, [selectedParentId, selectedChildId, productId, productTypes, isInitialized]);

    const handleParentSelect = (parent: VariantItem) => {
        // If clicking the same parent, unselect it
        if (selectedParentId === parent.id) {
            setSelectedParentId(null);
            setSelectedChildId(null);
            onOptionChange?.({});
        } else {
            setSelectedParentId(parent.id);
            setSelectedChildId(null); // Always reset child when parent changes

            if (!parent.children || parent.children.length === 0) {
                onOptionChange?.({ type: parent.name, typeId: String(parent.id) });
            } else {
                onOptionChange?.({ type: parent.name, typeId: "" });
            }
        }
    };

    const handleChildSelect = (child: VariantItem, parentName: string) => {
        // Allow click to unselect child
        if (selectedChildId === child.id) {
            setSelectedChildId(null);
            onOptionChange?.({ type: parentName, typeId: "" });
        } else {
            setSelectedChildId(child.id);
            onOptionChange?.({ type: parentName, subType: child.name, typeId: String(child.id) });
        }
    };

    // Notify parent about extra price whenever selections change
    useEffect(() => {
        const parent = (productTypes as VariantItem[]).find(p => p.id === selectedParentId);
        const child = parent?.children?.find(c => c.id === selectedChildId);
        const extra = (parent?.price || 0) + (child?.price || 0);
        onPriceChange?.(extra);
    }, [selectedParentId, selectedChildId, productTypes]);

    // Hide entire section while loading or if no data
    if (isLoading || productTypes.length === 0) return null;

    const selectedParent: VariantItem | undefined = (productTypes as VariantItem[]).find(
        (p) => p.id === selectedParentId
    );
    const childrenList = selectedParent?.children ?? [];

    return (
        <div className={cn("bg-white rounded-[1.25rem] border border-slate-200 p-5 shadow-sm space-y-5", className)}>
            {/* ── Parent Variants Row ─────────────────────────── */}
            <div className="space-y-3">
                <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    Variant tanlang
                </h3>
                <div className="flex flex-wrap gap-2.5">
                    {(productTypes as VariantItem[]).map((parent) => {
                        const isSelected = selectedParentId === parent.id;
                        const isOutOfStock = (parent.stock ?? 0) === 0;

                        return (
                            <button
                                key={parent.id}
                                type="button"
                                disabled={isOutOfStock}
                                onClick={() => handleParentSelect(parent)}
                                className={cn(
                                    "shrink-0 flex flex-col items-center justify-center min-w-[5.5rem] h-14 px-4 rounded-2xl border transition-all duration-200 relative",
                                    isSelected
                                        ? "border-[#007AFF] bg-[#F0F8FF] shadow-sm"
                                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                                    isOutOfStock && "opacity-40 cursor-not-allowed bg-slate-50 border-slate-100 overflow-hidden"
                                )}
                            >
                                <span className={cn(
                                    "text-[14px] font-bold tracking-tight leading-tight",
                                    isSelected ? "text-[#007AFF]" : "text-slate-900"
                                )}>
                                    {parent.name}
                                </span>
                                {(parent.price ?? 0) > 0 && (
                                    <span className="text-[10px] font-bold text-emerald-500 mt-0.5">
                                        (+{(parent.price ?? 0).toLocaleString()} so'm)
                                    </span>
                                )}
                                {parent.stock !== undefined && !isOutOfStock && (
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase mt-0.5",
                                        isSelected ? "text-[#007AFF]/70" : "text-slate-400"
                                    )}>
                                        {parent.stock} dona
                                    </span>
                                )}
                                {isOutOfStock && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-[110%] h-[1.5px] bg-slate-400 rotate-[15deg] rounded-full" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Conditional Child Variants Row ──────────────── */}
            {selectedParent && childrenList.length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                        {selectedParent.name} — turini tanlang
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                        {childrenList.map((child) => {
                            const isSelected = selectedChildId === child.id;
                            const isOutOfStock = (child.stock ?? 0) === 0;

                            return (
                                <button
                                    key={child.id}
                                    type="button"
                                    disabled={isOutOfStock}
                                    onClick={() => handleChildSelect(child, selectedParent.name)}
                                    className={cn(
                                        "shrink-0 flex flex-col items-center justify-center min-w-[5.5rem] h-14 px-4 rounded-2xl border transition-all duration-200 relative",
                                        isSelected
                                            ? "border-[#007AFF] bg-[#F0F8FF] shadow-sm"
                                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                                        isOutOfStock && "opacity-40 cursor-not-allowed bg-slate-50 border-slate-100 overflow-hidden"
                                    )}
                                >
                                    <span className={cn(
                                        "text-[14px] font-bold tracking-tight leading-tight",
                                        isSelected ? "text-[#007AFF]" : "text-slate-900"
                                    )}>
                                        {child.name}
                                    </span>
                                    {(child.price ?? 0) > 0 && (
                                        <span className="text-[10px] font-bold text-emerald-500 mt-0.5">
                                            (+{(child.price ?? 0).toLocaleString()} so'm)
                                        </span>
                                    )}
                                    {child.stock !== undefined && !isOutOfStock && (
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase mt-0.5",
                                            isSelected ? "text-[#007AFF]/70" : "text-slate-400"
                                        )}>
                                            {child.stock} dona
                                        </span>
                                    )}
                                    {isOutOfStock && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-[110%] h-[1.5px] bg-slate-400 rotate-[15deg] rounded-full" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
