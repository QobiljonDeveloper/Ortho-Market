"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "../context/CartContext";
import { ProductVariants } from "./ProductVariants";
import { useProductVariants } from "../hooks/useProductVariants";
import type { Product } from "../types";

interface AddToCartDrawerProps {
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
        transition: { type: "spring" as const, damping: 32, stiffness: 380 },
    },
    exit: {
        y: "100%",
        transition: { type: "spring" as const, damping: 32, stiffness: 380 },
    },
};

export function AddToCartDrawer({
    open,
    onOpenChange,
    product,
}: AddToCartDrawerProps) {
    const { addToCart } = useCart();
    const { data: variants } = useProductVariants(product.id);
    const [selected, setSelected] = useState<Record<string, string>>({});
    const [showErrors, setShowErrors] = useState(false);

    // Reset state on open
    useEffect(() => {
        if (open) {
            setSelected({});
            setShowErrors(false);
        }
    }, [open]);

    const primaryImageUrl =
        product.images?.find((img) => img.isPrimary)?.url ||
        product.images?.[0]?.url ||
        product.image;

    const handleConfirm = useCallback(() => {
        // Validation: Ensure all categories are selected
        const mainTypes = variants?.filter((v: any) => v.typeId === null) || [];
        const isFlat = mainTypes.length > 0 && mainTypes.every((m: any) => !variants?.some((v: any) => v.typeId === m.id));

        if (isFlat) {
            if (!selected["type"]) {
                setShowErrors(true);
                setTimeout(() => setShowErrors(false), 2000);
                return;
            }
        } else {
            const requiredTypes = mainTypes.filter((m: any) => variants?.some((v: any) => v.typeId === m.id));
            const missingSelections = requiredTypes.filter((m: any) => !selected[m.name]);

            if (missingSelections.length > 0) {
                setShowErrors(true);
                setTimeout(() => setShowErrors(false), 2000);
                return;
            }
        }

        addToCart(product);
        onOpenChange(false);
    }, [variants, selected, addToCart, product, onOpenChange]);

    const close = useCallback(() => onOpenChange(false), [onOpenChange]);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-200">
                    {/* ── Dark Overlay Backdrop ──────────────────── */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.2 }}
                        onClick={close}
                        className="absolute inset-0 bg-black/30"
                    />

                    {/* ── Slide-up Drawer ────────────────────────── */}
                    <motion.div
                        variants={sheetVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-4xl bg-white overflow-hidden flex flex-col shadow-[0_-8px_40px_rgba(0,0,0,0.1)]"
                    >
                        {/* ── Handle Bar + Close ───────────────────── */}
                        <div className="flex items-center justify-center px-5 pt-3 pb-1 shrink-0 relative">
                            <div className="w-10 h-1 rounded-full bg-slate-200" />
                            <button
                                onClick={close}
                                className="absolute right-4 top-3 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors active:scale-90"
                            >
                                <X className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* ── Product Summary ──────────────────────── */}
                        <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
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
                                <h3 className="text-slate-800 font-semibold text-[15px] leading-snug line-clamp-2">
                                    {product.nameUz || product.name}
                                </h3>
                                <p className="text-blue-500 font-bold text-lg mt-0.5">
                                    {product.basePrice?.toLocaleString()} so'm
                                </p>
                            </div>
                        </div>

                        {/* ── Variant Selector ─────────────────────── */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-hide">
                            <ProductVariants
                                productId={product.id}
                                onOptionChange={setSelected}
                                initialSelectedOptions={selected}
                            />
                            {showErrors && (
                                <p className="text-red-500 text-sm font-medium mt-4 animate-in fade-in slide-in-from-top-1">
                                    Iltimos, barcha variantlarni tanlang
                                </p>
                            )}
                        </div>

                        {/* ── Sticky Confirm Button ────────────────── */}
                        <div className="p-5 pt-3 shrink-0 border-t border-slate-100 bg-white">
                            <button
                                onClick={handleConfirm}
                                className={cn(
                                    "w-full h-[52px] rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all duration-200 outline-none",
                                    "bg-blue-500 text-white shadow-sm",
                                    "hover:bg-blue-600",
                                    "active:scale-[0.97]"
                                )}
                            >
                                <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />
                                Tasdiqlash
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
