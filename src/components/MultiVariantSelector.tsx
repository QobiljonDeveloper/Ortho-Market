import React, { useState, useEffect } from "react";
import { Plus, Minus, ShoppingBag, ShoppingCart, Sparkles, HelpCircle, Layers, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// 1. Definition of the nested Variant Interfaces
export interface SubTypeVariant {
    id: string | number;
    name: string;
    stock?: number;         // Optional to match API structure
    priceModifier?: string; // e.g. "+30 000 UZS"
    priceExtra?: number;    // Numerical extra price
    price?: number;         // Alternate price property
}

export interface ParentVariant {
    id: string | number;
    name: string;
    stock?: number;         // Optional to match API structure
    priceExtra?: number;    // Numerical extra price
    price?: number;         // Alternate price property
    colorCode?: string;     // Optional Hex code for beautiful visual chips
    children?: SubTypeVariant[];
    subTypes?: SubTypeVariant[]; // Support both children and subTypes keys
}

interface MultiVariantSelectorProps {
    productId?: string;
    productName?: string;
    basePrice?: number;      // Product baseline price
    variants?: ParentVariant[];
    onAddToCart?: (items: { type: "parent" | "subType"; id: string | number; parentId?: string | number; quantity: number; name: string; priceExtra: number }[]) => void;
}

// 2. High-fidelity Mock Data matching nested hierarchical parent-child structure
const DEFAULT_NESTED_VARIANTS: ParentVariant[] = [
    {
        id: 1,
        name: "Purple Variant",
        stock: 40,
        priceExtra: 0,
        colorCode: "#8B5CF6",
        subTypes: [
            { id: 101, name: "Premium Test Sub-Type", stock: 10, priceModifier: "+30 000 UZS", priceExtra: 30000 },
            { id: 102, name: "Standard Test Sub-Type", stock: 5, priceModifier: "+15 000 UZS", priceExtra: 15000 },
        ]
    },
    {
        id: 2,
        name: "Red Variant",
        stock: 15,
        priceExtra: 10000,
        colorCode: "#EF4444",
        subTypes: [
            { id: 201, name: "Glossy Finish", stock: 8, priceModifier: "+12 000 UZS", priceExtra: 12000 },
            { id: 202, name: "Matte Tech Coating", stock: 0, priceModifier: "+25 000 UZS", priceExtra: 25000 }, // Out of stock example
        ]
    },
    {
        id: 3,
        name: "Ocean Blue Variant",
        stock: 25,
        priceExtra: 0,
        colorCode: "#3B82F6",
        subTypes: [] // Flat parent variant with no children
    }
];

export function MultiVariantSelector({
    productId = "prod-99",
    productName = "Premium Medical Specimen Drawer",
    basePrice = 150000, // 150,000 UZS baseline
    variants = DEFAULT_NESTED_VARIANTS,
    onAddToCart,
}: MultiVariantSelectorProps) {
    // 3. State tracking chosen quantities for BOTH parents and sub-types: { "parent-1": 2, "sub-101": 1 }
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Hydrate quantities from localStorage on mount/sync
    useEffect(() => {
        try {
            const saved = localStorage.getItem('tg_cart_variants');
            if (!saved) return;
            const savedMap = JSON.parse(saved);
            const productData = savedMap[String(productId)];
            if (productData && productData.productTypeId === "multi" && Array.isArray(productData.selections)) {
                const initialQty: Record<string, number> = {};
                productData.selections.forEach((sel: any) => {
                    // Check if this productTypeId is a sub-type or a parent
                    const isSub = variants.some(parent => 
                        (parent.children || parent.subTypes || []).some(child => String(child.id) === String(sel.productTypeId))
                    );
                    const key = isSub ? `sub-${sel.productTypeId}` : `parent-${sel.productTypeId}`;
                    initialQty[key] = sel.quantity;
                });
                setQuantities(initialQty);
            }
        } catch (e) {
            console.error("Error reading initial variant quantities:", e);
        }
    }, [productId, variants]);

    // Increment Handler
    const increment = (type: "parent" | "sub", id: string | number, stock: number) => {
        const key = `${type}-${id}`;
        setQuantities((prev) => {
            const currentQty = prev[key] || 0;
            if (currentQty >= stock) return prev; // Cannot exceed specific stock limit
            return {
                ...prev,
                [key]: currentQty + 1,
            };
        });
    };

    // Decrement Handler
    const decrement = (type: "parent" | "sub", id: string | number) => {
        const key = `${type}-${id}`;
        setQuantities((prev) => {
            const currentQty = prev[key] || 0;
            if (currentQty <= 0) return prev;
            
            const updated = { ...prev, [key]: currentQty - 1 };
            // Clean up 0 quantity keys to keep state light
            if (updated[key] === 0) {
                delete updated[key];
            }
            return updated;
        });
    };

    // Parse selection details for listing and price aggregation
    const selectedItemsList = React.useMemo(() => {
        const list: {
            type: "parent" | "subType";
            id: string | number;
            parentId?: string | number;
            quantity: number;
            name: string;
            priceExtra: number;
        }[] = [];

        variants.forEach((parent) => {
            const parentKey = `parent-${parent.id}`;
            const parentQty = quantities[parentKey] || 0;
            const parentPriceExtra = parent.priceExtra || parent.price || 0;

            if (parentQty > 0) {
                list.push({
                    type: "parent",
                    id: parent.id,
                    quantity: parentQty,
                    name: parent.name,
                    priceExtra: parentPriceExtra
                });
            }

            const childrenList = parent.children || parent.subTypes || [];
            childrenList.forEach((child) => {
                const childKey = `sub-${child.id}`;
                const childQty = quantities[childKey] || 0;
                const childPriceExtra = child.priceExtra || child.price || 0;

                if (childQty > 0) {
                    list.push({
                        type: "subType",
                        id: child.id,
                        parentId: parent.id,
                        quantity: childQty,
                        name: `${parent.name} ➔ ${child.name}`,
                        priceExtra: childPriceExtra
                    });
                }
            });
        });

        return list;
    }, [variants, quantities]);

    const totalSelectedQuantity = selectedItemsList.reduce((sum, item) => sum + item.quantity, 0);

    // 3. Inspect currently selected variants / quantities state in console
    React.useEffect(() => {
        console.log("🎯 [DEBUG-VARIANTS-SELECTIONS] Selected items quantities map:", quantities);
        console.log("🛒 [DEBUG-VARIANTS-FORMATTED] Selected items list to be added to cart:", selectedItemsList);
    }, [quantities, selectedItemsList]);
    
    const totalPricing = selectedItemsList.reduce(
        (sum, item) => sum + (basePrice + item.priceExtra) * item.quantity,
        0
    );

    const totalVariantsStock = React.useMemo(() => {
        return variants?.reduce((sum: number, parent: any) => {
            const parentStock = parent.stock || 0;
            const childrenList = parent.children || parent.subTypes || [];
            const childrenStock = childrenList.reduce((cSum: number, child: any) => cSum + (child.stock || 0), 0);
            return sum + parentStock + childrenStock;
        }, 0) || 0;
    }, [variants]);

    const isOutOfStock = variants && variants.length > 0 && totalVariantsStock === 0;

    // 4. Submit handler filtering out zero-quantity selections and returning formatted array
    const handleSubmit = () => {
        // 1. Global Variant Check
        const hasVariants = variants && variants.length > 0;
        if (hasVariants) {
            const keys = Object.keys(quantities);
            const totalQty = keys.reduce((sum, key) => sum + (quantities[key] || 0), 0);

            // Strict object length check, raw total sum, and array length check
            if (keys.length === 0 || totalQty === 0 || selectedItemsList.length === 0) {
                toast.error("Iltimos, mahsulot turini tanlang");
                return; // STOP execution completely
            }

            // 2. Strict Parent-Child Dependency Check
            for (const parent of variants) {
                const parentKey = `parent-${parent.id}`;
                const parentQty = quantities[parentKey] || 0;
                
                const childrenList = parent.children || parent.subTypes || [];
                const hasChildren = childrenList.length > 0;

                if (parentQty > 0 && hasChildren) {
                    const childKeys = childrenList.map(child => `sub-${child.id}`);
                    const childQty = childKeys.reduce((sum, key) => sum + (quantities[key] || 0), 0);
                    
                    if (childKeys.length === 0 || childQty === 0) {
                        toast.error(`Iltimos, "${parent.name}" uchun kichik turni tanlang.`);
                        return; // STOP execution completely
                    }
                }
            }
        }

        console.log("🛒 [Nested Cart Payload Generated]:", selectedItemsList);

        if (onAddToCart) {
            onAddToCart(selectedItemsList);
        } else {
            toast.success("Savatga muvaffaqiyatli qo'shildi!");
        }
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString() + " so'm";
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.03)] text-slate-800 space-y-6">
            
            {/* Header info */}
            <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#007AFF] tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    Ierarxik Variantlar Tanlovi
                </div>
                <h2 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                    {productName}
                </h2>
                <p className="text-xs font-semibold text-slate-400">
                    Baza narxi: <span className="text-slate-600 font-bold">{formatPrice(basePrice)}</span>
                </p>
            </div>

            {/* List of Hierarchical Variant Groups */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Mavjud modifikatsiyalar
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[#007AFF]" />
                        Mustaqil hisoblagichlar
                    </span>
                </div>
                
                <div className="space-y-4">
                    {variants.map((parent) => {
                        const parentQty = quantities[`parent-${parent.id}`] || 0;
                        const isParentOutOfStock = (parent.stock ?? 0) === 0;
                        const isParentSelected = parentQty > 0;
                        const parentPriceExtra = parent.priceExtra || parent.price || 0;

                        const childrenList = parent.children || parent.subTypes || [];
                        const hasChildren = childrenList.length > 0;

                        return (
                            <div key={parent.id} className="border border-slate-200/80 rounded-2xl p-4 space-y-3 bg-[#F8FAFC]/50 hover:bg-[#F8FAFC] transition-colors duration-300">
                                
                                {/* ── Parent Variant Row ────────────────── */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {parent.colorCode ? (
                                            <div
                                                className="w-5 h-5 rounded-full border border-black/10 shrink-0 shadow-inner"
                                                style={{ backgroundColor: parent.colorCode }}
                                            />
                                        ) : (
                                            <div className="w-5 h-5 rounded-lg bg-[#007AFF]/10 border border-[#007AFF]/20 flex items-center justify-center text-[#007AFF] text-[9px] font-bold shrink-0">
                                                ★
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-extrabold leading-tight ${isParentSelected ? "text-[#007AFF]" : "text-slate-800"}`}>
                                                {parent.name}
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[11px] font-bold text-slate-400">
                                                    {formatPrice(basePrice + parentPriceExtra)}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="text-[10px] font-semibold text-slate-400">
                                                    Zaxira: {parent.stock ?? 0} ta
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parent Stepper */}
                                    {isParentOutOfStock ? (
                                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                                            Tugagan
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-2.5 bg-white border border-slate-200 p-0.5 rounded-xl shadow-sm">
                                            <button
                                                type="button"
                                                onClick={() => decrement("parent", parent.id)}
                                                disabled={parentQty === 0}
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                                    parentQty > 0
                                                        ? "text-slate-700 hover:bg-slate-100 active:scale-90"
                                                        : "text-slate-300 cursor-not-allowed"
                                                }`}
                                            >
                                                <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                            </button>
                                            <span className={`w-5 text-center text-xs font-black ${parentQty > 0 ? "text-[#007AFF]" : "text-slate-400"}`}>
                                                {parentQty}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => increment("parent", parent.id, parent.stock ?? 0)}
                                                disabled={parentQty >= (parent.stock ?? 0)}
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                                    parentQty < (parent.stock ?? 0)
                                                        ? "text-[#007AFF] hover:bg-[#007AFF]/10 active:scale-90"
                                                        : "text-slate-300 cursor-not-allowed"
                                                }`}
                                            >
                                                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ── Sub-Types Indented Hierarchy Area ── */}
                                {hasChildren && (
                                    <div className="pl-4 ml-2 border-l-2 border-slate-200/80 pt-2.5 space-y-2.5">
                                        {childrenList.map((child) => {
                                            const childQty = quantities[`sub-${child.id}`] || 0;
                                            const isChildOutOfStock = (child.stock ?? 0) === 0;
                                            const isChildSelected = childQty > 0;
                                            const childPriceExtra = child.priceExtra || child.price || 0;

                                            return (
                                                <div key={child.id} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                                                    isChildOutOfStock
                                                        ? "bg-slate-50/50 border-slate-100 opacity-55"
                                                        : isChildSelected
                                                        ? "border-[#007AFF]/40 bg-[#007AFF]/[0.01] shadow-inner"
                                                        : "border-slate-200 bg-white"
                                                }`}>
                                                    
                                                    {/* Sub-type details */}
                                                    <div className="flex flex-col pr-2">
                                                        <span className={`text-[12px] font-bold leading-tight ${isChildSelected ? "text-slate-900 font-extrabold" : "text-slate-600"}`}>
                                                            {child.name}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            {child.priceModifier ? (
                                                                <span className="text-[10px] font-bold text-slate-500">
                                                                    {child.priceModifier}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-[#007AFF]">
                                                                    +{formatPrice(childPriceExtra)}
                                                                </span>
                                                            )}
                                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                            <span className="text-[9px] font-semibold text-slate-400">
                                                                Zaxira: {child.stock ?? 0} ta
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Sub-type Stepper */}
                                                    {isChildOutOfStock ? (
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded">
                                                            Tugagan
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 p-0.5 rounded-lg shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => decrement("sub", child.id)}
                                                                disabled={childQty === 0}
                                                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                                                    childQty > 0
                                                                        ? "text-slate-700 hover:bg-slate-200/60 active:scale-90"
                                                                        : "text-slate-300 cursor-not-allowed"
                                                                }`}
                                                            >
                                                                <Minus className="w-3 h-3" strokeWidth={2.5} />
                                                            </button>
                                                            <span className={`w-4 text-center text-[11px] font-extrabold ${childQty > 0 ? "text-[#007AFF]" : "text-slate-400"}`}>
                                                                {childQty}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => increment("sub", child.id, child.stock ?? 0)}
                                                                disabled={childQty >= (child.stock ?? 0)}
                                                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                                                    childQty < (child.stock ?? 0)
                                                                        ? "text-[#007AFF] hover:bg-[#007AFF]/10 active:scale-90"
                                                                        : "text-slate-300 cursor-not-allowed"
                                                                }`}
                                                            >
                                                                <Plus className="w-3 h-3" strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selection Summary */}
            {totalSelectedQuantity > 0 && (
                <div className="bg-[#007AFF]/5 border border-[#007AFF]/10 rounded-2xl p-4 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2 text-xs font-black text-[#007AFF] uppercase tracking-wider">
                        <CheckCircle className="w-4 h-4" />
                        Tanlangan to'plam
                    </div>
                    
                    <div className="space-y-1.5 max-h-28 overflow-y-auto divide-y divide-slate-100 pr-1.5">
                        {selectedItemsList.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs py-1.5 first:pt-0">
                                <span className="font-bold text-slate-700 truncate max-w-[240px]">
                                    {item.name} <span className="text-[#007AFF]">({item.quantity} ta)</span>
                                </span>
                                <span className="font-bold text-slate-900 shrink-0">
                                    {formatPrice((basePrice + item.priceExtra) * item.quantity)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/50 flex justify-between items-center text-sm">
                        <span className="font-black text-slate-500 uppercase text-[10px] tracking-wider">Tanlangan jami</span>
                        <span className="font-black text-[#007AFF] text-base">
                            {formatPrice(totalPricing)}
                        </span>
                    </div>
                </div>
            )}

            {/* Submission Action Button */}
            <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleSubmit}
                className={cn(
                    "w-full h-13 rounded-full font-black text-sm transition-all flex items-center justify-center gap-2",
                    isOutOfStock 
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none" 
                        : "bg-[#007AFF] hover:bg-[#005bb5] text-white shadow-[0_8px_20px_rgba(0,122,255,0.15)] hover:shadow-[0_10px_25px_rgba(0,122,255,0.25)]"
                )}
            >
                {isOutOfStock ? (
                    "Bu mahsulot qolmagan"
                ) : (
                    <>
                        <ShoppingCart className="w-4.5 h-4.5" />
                        {totalSelectedQuantity > 0 
                            ? `Savatga qo'shish (${totalSelectedQuantity} dona)` 
                            : "Savatga qo'shish"
                        }
                    </>
                )}
            </button>
        </div>
    );
}
