import React, { useState } from "react";
import { Plus, Minus, ShoppingBag, AlertCircle, Info, Sparkles } from "lucide-react";

// 1. Definition of the Variant Interface
export interface Variant {
    id: string;
    name: string;
    stock: number;
    priceExtra: number;      // Extra cost (e.g. +12,000 so'm)
    colorCode?: string;      // Optional Hex code for beautiful visual chips
}

interface MultiVariantSelectorProps {
    productId?: string;
    productName?: string;
    basePrice?: number;      // Product baseline price
    variants?: Variant[];
    onAddToCart?: (items: { variantId: string; quantity: number }[]) => void;
}

// 2. Mock Data representing beautiful variants
const DEFAULT_VARIANTS: Variant[] = [
    { id: "var-purple", name: "Imperial Purple", stock: 5, priceExtra: 15000, colorCode: "#8B5CF6" },
    { id: "var-red", name: "Crimson Red", stock: 3, priceExtra: 20000, colorCode: "#EF4444" },
    { id: "var-blue", name: "Ocean Blue", stock: 10, priceExtra: 0, colorCode: "#3B82F6" },
    { id: "var-green", name: "Emerald Green", stock: 0, priceExtra: 10000, colorCode: "#10B981" }, // Out of stock example
];

export function MultiVariantSelector({
    productId = "prod-99",
    productName = "Premium Titanium Bracket",
    basePrice = 120000, // 120,000 so'm base
    variants = DEFAULT_VARIANTS,
    onAddToCart,
}: MultiVariantSelectorProps) {
    // 3. State tracking chosen quantities: { [variantId]: quantity }
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

    // Increment Handler
    const increment = (variantId: string, stock: number) => {
        setSelectedQuantities((prev) => {
            const currentQty = prev[variantId] || 0;
            if (currentQty >= stock) return prev; // Cannot exceed stock limit
            return {
                ...prev,
                [variantId]: currentQty + 1,
            };
        });
    };

    // Decrement Handler
    const decrement = (variantId: string) => {
        setSelectedQuantities((prev) => {
            const currentQty = prev[variantId] || 0;
            if (currentQty <= 0) return prev;
            
            const updated = { ...prev, [variantId]: currentQty - 1 };
            // Clean up 0 quantity keys to keep state light
            if (updated[variantId] === 0) {
                delete updated[variantId];
            }
            return updated;
        });
    };

    // Calculate aggregated information
    const selectedItemsList = Object.entries(selectedQuantities).map(([variantId, qty]) => {
        const variantObj = variants.find((v) => v.id === variantId);
        return {
            variantId,
            quantity: qty,
            priceEach: basePrice + (variantObj?.priceExtra || 0),
            name: variantObj?.name || variantId,
        };
    });

    const totalSelectedQuantity = selectedItemsList.reduce((sum, item) => sum + item.quantity, 0);
    
    const totalPrice = selectedItemsList.reduce(
        (sum, item) => sum + item.priceEach * item.quantity,
        0
    );

    // 4. Cart Submission Handler
    const handleSubmit = () => {
        // Filter out any 0 or invalid quantities (redundancy protection)
        const finalSelection = Object.entries(selectedQuantities)
            .filter(([_, qty]) => qty > 0)
            .map(([variantId, qty]) => ({
                variantId,
                quantity: qty,
            }));

        console.log("🛒 [Cart Payload Generated]:", finalSelection);

        if (onAddToCart) {
            onAddToCart(finalSelection);
        } else {
            alert(
                `Savatchaga qo'shildi:\n${finalSelection
                    .map((item) => {
                        const vName = variants.find((v) => v.id === item.variantId)?.name;
                        return `- ${vName}: ${item.quantity} dona`;
                    })
                    .join("\n")}`
            );
        }
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString() + " so'm";
    };

    return (
        <div className="w-full max-w-md mx-auto bg-[#F8FAFC] border border-slate-200/80 rounded-3xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.03)] text-slate-800 space-y-6">
            
            {/* Header info */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#007AFF] tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        Multi-Variant Tanlov
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                        {productName}
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                        Baza narxi: <span className="text-slate-600 font-bold">{formatPrice(basePrice)}</span>
                    </p>
                </div>
            </div>

            {/* List of Variant Cards */}
            <div className="space-y-3.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                    Mavjud turlar (Variantlar)
                </span>
                
                <div className="grid gap-3">
                    {variants.map((variant) => {
                        const qtySelected = selectedQuantities[variant.id] || 0;
                        const isOutOfStock = variant.stock === 0;
                        const isSelected = qtySelected > 0;

                        return (
                            <div
                                key={variant.id}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                                    isOutOfStock
                                        ? "bg-slate-50/50 border-slate-100 opacity-55"
                                        : isSelected
                                        ? "border-[#007AFF] bg-[#007AFF]/[0.02] shadow-[0_4px_12px_rgba(0,122,255,0.03)]"
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                            >
                                {/* Variant Details */}
                                <div className="flex items-center gap-3.5">
                                    {variant.colorCode && (
                                        <div
                                            className="w-5 h-5 rounded-full border border-black/10 shrink-0 shadow-inner"
                                            style={{ backgroundColor: variant.colorCode }}
                                        />
                                    )}
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold leading-tight ${
                                            isSelected ? "text-slate-900" : "text-slate-700"
                                        }`}>
                                            {variant.name}
                                        </span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] font-bold text-slate-400">
                                                {formatPrice(basePrice + variant.priceExtra)}
                                            </span>
                                            {!isOutOfStock && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <span className="text-[10px] font-semibold text-slate-400">
                                                        Zaxira: {variant.stock} dona
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Increment/Decrement controls */}
                                {isOutOfStock ? (
                                    <span className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-wider border border-red-100 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Mavjud emas
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
                                        {/* Minus button */}
                                        <button
                                            type="button"
                                            onClick={() => decrement(variant.id)}
                                            disabled={qtySelected === 0}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                                qtySelected > 0
                                                    ? "text-slate-700 hover:bg-slate-200/80 active:scale-90"
                                                    : "text-slate-300 cursor-not-allowed"
                                            }`}
                                        >
                                            <Minus className="w-4 h-4" strokeWidth={2.5} />
                                        </button>

                                        {/* Display selected count */}
                                        <span className={`w-6 text-center text-xs font-black ${
                                            isSelected ? "text-[#007AFF] text-sm" : "text-slate-400"
                                        }`}>
                                            {qtySelected}
                                        </span>

                                        {/* Plus button */}
                                        <button
                                            type="button"
                                            onClick={() => increment(variant.id, variant.stock)}
                                            disabled={qtySelected >= variant.stock}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                                qtySelected < variant.stock
                                                    ? "text-[#007AFF] hover:bg-[#007AFF]/10 active:scale-90"
                                                    : "text-slate-300 cursor-not-allowed"
                                            }`}
                                        >
                                            <Plus className="w-4 h-4" strokeWidth={2.5} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selection Summary (Visible only if items are selected) */}
            {totalSelectedQuantity > 0 && (
                <div className="bg-[#007AFF]/5 border border-[#007AFF]/10 rounded-2xl p-4.5 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2 text-xs font-black text-[#007AFF] uppercase tracking-wider">
                        <Info className="w-4 h-4" />
                        Tanlangan to'plam
                    </div>
                    
                    <div className="space-y-1.5 max-h-24 overflow-y-auto divide-y divide-slate-100 pr-1.5">
                        {selectedItemsList.map((item) => (
                            <div key={item.variantId} className="flex justify-between items-center text-xs py-1.5 first:pt-0">
                                <span className="font-bold text-slate-700">
                                    {item.name} <span className="text-[#007AFF]">({item.quantity} dona)</span>
                                </span>
                                <span className="font-bold text-slate-900">
                                    {formatPrice(item.priceEach * item.quantity)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center text-sm">
                        <span className="font-black text-slate-500 uppercase text-[10px] tracking-wider">Tanlangan jami</span>
                        <span className="font-black text-[#007AFF] text-base">
                            {formatPrice(totalPrice)}
                        </span>
                    </div>
                </div>
            )}

            {/* Submission Action Button */}
            <button
                type="button"
                onClick={handleSubmit}
                disabled={totalSelectedQuantity === 0}
                className="w-full h-13 rounded-full font-black text-sm bg-[#007AFF] hover:bg-[#005bb5] text-white shadow-[0_8px_20px_rgba(0,122,255,0.15)] hover:shadow-[0_10px_25px_rgba(0,122,255,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-55 disabled:cursor-not-allowed disabled:shadow-none"
            >
                <ShoppingBag className="w-4.5 h-4.5" />
                Savatga qo'shish ({totalSelectedQuantity} dona)
            </button>
        </div>
    );
}
