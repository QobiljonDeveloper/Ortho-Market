"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "../context/CartContext";
import { VariantSelector, type VariantValidationErrors } from "./VariantSelector";
import type { Product, SelectedVariants } from "../types";

interface AddToCartBottomSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product;
}

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const sheetVariants = {
    hidden: { y: "100%" },
    visible: {
        y: 0,
        transition: { type: "spring" as const, damping: 30, stiffness: 350 },
    },
    exit: {
        y: "100%",
        transition: { type: "spring" as const, damping: 30, stiffness: 350 },
    },
};

export function AddToCartBottomSheet({
    open,
    onOpenChange,
    product,
}: AddToCartBottomSheetProps) {
    const { addToCart } = useCart();
    const [selected, setSelected] = useState<SelectedVariants>({});
    const [errors, setErrors] = useState<VariantValidationErrors>({});

    // Reset state on open
    useEffect(() => {
        if (open) {
            setSelected({});
            setErrors({});
        }
    }, [open]);

    const hasColors = product.colors && product.colors.length > 0;
    const hasSizes = product.sizes && product.sizes.length > 0;

    const primaryImageUrl =
        product.images?.find((img) => img.isPrimary)?.url ||
        product.images?.[0]?.url ||
        product.image;

    const handleAddToCart = useCallback(() => {
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
            // Clear shake after animation completes
            setTimeout(() => setErrors({}), 600);
            return;
        }

        addToCart(product);
        onOpenChange(false);
    }, [hasColors, hasSizes, selected, addToCart, product, onOpenChange]);

    const close = useCallback(() => onOpenChange(false), [onOpenChange]);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-200">
                    {/* Backdrop */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.2 }}
                        onClick={close}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        variants={sheetVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-4xl glass-dark-bg overflow-hidden flex flex-col shadow-[0_-10px_60px_rgba(0,0,0,0.5)]"
                    >
                        {/* Handle + Close */}
                        <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
                            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto" />
                            <button
                                onClick={close}
                                className="absolute right-4 top-4 w-9 h-9 rounded-full glass-surface flex items-center justify-center text-white/60 hover:text-white transition-colors active:scale-90"
                            >
                                <X className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Product Summary */}
                        <div className="flex items-center gap-4 px-5 pb-4 border-b border-white/5">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                {primaryImageUrl ? (
                                    <img
                                        src={primaryImageUrl}
                                        alt={product.nameUz}
                                        className="w-full h-full object-contain p-1.5"
                                    />
                                ) : (
                                    <span className="text-2xl opacity-40">📦</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-semibold text-[15px] leading-snug line-clamp-2">
                                    {product.nameUz || product.name}
                                </h3>
                                <p className="text-[#007AFF] font-bold text-lg mt-0.5">
                                    {product.basePrice?.toLocaleString()} so'm
                                </p>
                            </div>
                        </div>

                        {/* Variant Selector */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-hide">
                            <VariantSelector
                                colors={product.colors}
                                sizes={product.sizes}
                                selected={selected}
                                onChange={setSelected}
                                validationErrors={errors}
                            />
                        </div>

                        {/* Add to Cart CTA */}
                        <div className="p-5 pt-3 shrink-0 border-t border-white/5">
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={handleAddToCart}
                                className={cn(
                                    "w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all duration-200 outline-none",
                                    "bg-[#007AFF] text-white shadow-[0_0_30px_rgba(0,122,255,0.3)]",
                                    "hover:shadow-[0_0_40px_rgba(0,122,255,0.45)]",
                                    "active:scale-[0.97]"
                                )}
                            >
                                <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />
                                Savatga qo'shish
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
