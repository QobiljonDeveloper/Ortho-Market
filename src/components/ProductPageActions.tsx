"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "../context/CartContext";
import { VariantSelector, type VariantValidationErrors } from "./VariantSelector";
import type { Product, SelectedVariants } from "../types";

interface ProductPageActionsProps {
    product: Product;
}

export function ProductPageActions({ product }: ProductPageActionsProps) {
    const { addToCart, getItemQuantity, updateQuantity } = useCart();
    const [selected, setSelected] = useState<SelectedVariants>({});
    const [errors, setErrors] = useState<VariantValidationErrors>({});

    const quantity = getItemQuantity(product.id);
    const hasColors = product.colors && product.colors.length > 0;
    const hasSizes = product.sizes && product.sizes.length > 0;
    const hasVariants = hasColors || hasSizes;

    const handleAddToCart = useCallback(() => {
        if (hasVariants) {
            const newErrors: VariantValidationErrors = {};
            let hasError = false;

            if (hasColors && !selected.color) {
                newErrors.color = true;
                hasError = true;
            }
            if (hasSizes && !selected.size) {
                newErrors.size = true;
                hasError = true;
            }

            if (hasError) {
                setErrors(newErrors);
                setTimeout(() => setErrors({}), 600);
                return;
            }
        }

        addToCart(product);
    }, [hasVariants, hasColors, hasSizes, selected, addToCart, product]);

    return (
        <>
            {/* ── Inline Variant Selector (dark-glass card) ────── */}
            {hasVariants && (
                <div className="rounded-[1.25rem] overflow-hidden glass-dark-bg p-5 shadow-[0_4px_30px_rgba(0,0,0,0.15)]">
                    <VariantSelector
                        colors={product.colors}
                        sizes={product.sizes}
                        selected={selected}
                        onChange={setSelected}
                        validationErrors={errors}
                    />
                </div>
            )}

            {/* ── Sticky Bottom CTA ──────────────────────────── */}
            <div className="sticky bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-2xl border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] z-40">
                {quantity === 0 ? (
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={handleAddToCart}
                        className={cn(
                            "w-full h-14 rounded-full font-bold text-base flex items-center justify-center gap-2 transition-all outline-none",
                            "bg-[#007AFF] text-white",
                            "shadow-[0_8px_20px_rgba(0,122,255,0.25)]",
                            "hover:shadow-[0_10px_25px_rgba(0,122,255,0.35)]",
                            "active:scale-[0.97]"
                        )}
                    >
                        <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />
                        Savatga
                    </motion.button>
                ) : (
                    <div className="w-full h-14 bg-[#F8FAFC] border border-slate-200 shadow-inner rounded-full flex items-center justify-between p-1.5">
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
                            className="w-12 h-11 flex items-center justify-center bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] rounded-full shadow-sm transition-colors active:scale-95 border border-[#007AFF]/20"
                        >
                            <Plus className="h-5 w-5" strokeWidth={2} />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
