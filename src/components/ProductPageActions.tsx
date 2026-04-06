"use client";

import { useState, useCallback } from "react";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "../context/CartContext";
import { ProductVariants } from "./ProductVariants";
import { useProductVariants } from "../hooks/useProductVariants";
import type { Product } from "../types";

interface ProductPageActionsProps {
    product: Product;
}

export function ProductPageActions({ product }: ProductPageActionsProps) {
    const { addToCart, getItemQuantity, updateQuantity } = useCart();
    const { data: variants } = useProductVariants(product.id);
    const [selected, setSelected] = useState<Record<string, string>>({});
    const [showErrors, setShowErrors] = useState(false);
    const quantity = getItemQuantity(product.id);

    const handleAddToCart = useCallback(() => {
        // Validation: Ensure selections are complete
        const mainTypes = variants?.filter((v: any) => v.typeId === null) || [];
        const isFlat = mainTypes.length > 0 && mainTypes.every(m => !variants?.some(v => v.typeId === m.id));

        let hasError = false;
        if (isFlat) {
            if (!selected["type"]) hasError = true;
        } else {
            const requiredTypes = mainTypes.filter(m => variants?.some(v => v.typeId === m.id));
            if (requiredTypes.some(m => !selected[m.name])) hasError = true;
        }

        if (hasError) {
            setShowErrors(true);
            setTimeout(() => setShowErrors(false), 2000);
            return;
        }

        addToCart(product);
    }, [variants, selected, addToCart, product]);

    return (
        <>
            {/* ── Inline Variant Selector ──────────────────── */}
            {variants && variants.length > 0 && (
                <>
                    <ProductVariants
                        productId={product.id}
                        onOptionChange={setSelected}
                        initialSelectedOptions={selected}
                        className="mb-2"
                    />
                    {showErrors && (
                        <p className="text-red-500 text-[13px] font-semibold mt-2 px-1 animate-in fade-in slide-in-from-top-1">
                            Iltimos, variantni tanlang
                        </p>
                    )}
                </>
            )}

            {/* ── Sticky Bottom CTA ──────────────────────── */}
            <div className="sticky bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-2xl border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] z-40">
                {quantity === 0 ? (
                    <button
                        onClick={handleAddToCart}
                        className={cn(
                            "w-full h-14 rounded-full font-bold text-base flex items-center justify-center gap-2 transition-all outline-none",
                            "bg-blue-500 text-white",
                            "shadow-[0_8px_20px_rgba(74,133,246,0.25)]",
                            "hover:bg-blue-600 hover:shadow-[0_10px_25px_rgba(74,133,246,0.35)]",
                            "active:scale-[0.97]"
                        )}
                    >
                        <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />
                        Savatga
                    </button>
                ) : (
                    <div className="w-full h-14 bg-slate-50 border border-slate-200 shadow-inner rounded-full flex items-center justify-between p-1.5">
                        <button
                            onClick={() =>
                                updateQuantity(product.id, Math.max(0, quantity - 1))
                            }
                            className="w-12 h-11 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 rounded-full shadow-sm transition-colors active:scale-95 border border-slate-200"
                        >
                            <Minus className="h-5 w-5" strokeWidth={2} />
                        </button>
                        <span className="text-xl font-black text-slate-900 tracking-widest">
                            {quantity}
                        </span>
                        <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="w-12 h-11 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-full shadow-sm transition-colors active:scale-95 border border-blue-200"
                        >
                            <Plus className="h-5 w-5" strokeWidth={2} />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
