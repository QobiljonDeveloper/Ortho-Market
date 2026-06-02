"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "../context/CartContext";
import { ProductVariants } from "./ProductVariants";
import { MultiVariantSelector } from "./MultiVariantSelector";
import { useProductVariants } from "../hooks/useProductVariants";
import type { Product } from "../types";
import { toast } from "sonner";

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
    const { addToCart, updateQuantity } = useCart();
    const { data: variantsData = [], isLoading: isVariantsLoading } = useProductVariants(product.id);
    const [selected, setSelected] = useState<Record<string, string>>({});
    const [showErrors, setShowErrors] = useState(false);

    const hasVariants = (variantsData && variantsData.length > 0) || isVariantsLoading;

    const handleAddToCart = (selectedItems: any[]) => {
        // 1. Global Variant Check
        const hasVariantsActual = variantsData && variantsData.length > 0;
        if (hasVariantsActual) {
            const totalQty = selectedItems ? selectedItems.reduce((sum, item) => sum + item.quantity, 0) : 0;
            
            // Strict check: array is completely empty, null/undefined, or sum of quantities is exactly 0
            if (!selectedItems || selectedItems.length === 0 || totalQty === 0) {
                toast.error("Iltimos, mahsulot turini tanlang");
                return; // STOP execution completely
            }

            // 2. Strict Parent-Child Dependency Check
            for (const parent of variantsData) {
                const parentSelection = selectedItems.find(item => item.type === "parent" && String(item.id) === String(parent.id));
                const parentQty = parentSelection ? parentSelection.quantity : 0;
                
                const childrenList = parent.children || parent.subTypes || [];
                const hasChildren = childrenList.length > 0;

                if (parentQty > 0 && hasChildren) {
                    const selectedChildren = selectedItems.filter(item => 
                        item.type === "subType" && 
                        String(item.parentId) === String(parent.id)
                    );
                    const childQty = selectedChildren.reduce((sum, item) => sum + item.quantity, 0);

                    // Strict check: child array is empty, or child quantity sum is 0
                    if (selectedChildren.length === 0 || childQty === 0) {
                        toast.error(`Iltimos, "${parent.name}" uchun kichik turni tanlang.`);
                        return; // STOP execution completely
                    }
                }
            }
        }

        // --- Safe dispatch to cart ---
        const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
        
        const saved = localStorage.getItem('tg_cart_variants');
        const savedMap = saved ? JSON.parse(saved) : {};
        
        savedMap[String(product.id)] = {
            productTypeId: "multi",
            selections: selectedItems.map(item => ({
                productTypeId: item.id,
                parentId: item.parentId,
                name: item.name,
                priceExtra: item.priceExtra,
                quantity: item.quantity
            }))
        };
        
        localStorage.setItem('tg_cart_variants', JSON.stringify(savedMap));
        
        addToCart(product);
        setTimeout(() => {
            updateQuantity(product.id, totalQuantity);
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('variantSaved'));
            onOpenChange(false);
        }, 200);
    };

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
        const mainTypes = variantsData?.filter((v: any) => v.typeId === null) || [];
        const isFlat = mainTypes.length > 0 && mainTypes.every((m: any) => !variantsData?.some((v: any) => v.typeId === m.id));

        if (isFlat) {
            if (!selected["type"]) {
                setShowErrors(true);
                setTimeout(() => setShowErrors(false), 2000);
                return;
            }
        } else {
            const requiredTypes = mainTypes.filter((m: any) => variantsData?.some((v: any) => v.typeId === m.id));
            const missingSelections = requiredTypes.filter((m: any) => !selected[m.name]);

            if (missingSelections.length > 0) {
                setShowErrors(true);
                setTimeout(() => setShowErrors(false), 2000);
                return;
            }
        }

        // Find selected parent and child objects to pass to addToCart
        const parentObj = variantsData.find((v: any) => v.name === selected["type"]);
        const childObj = parentObj
            ? ((parentObj.children || []).find((c: any) => c.name === selected["subType"]) ||
               (parentObj.subTypes || []).find((c: any) => c.name === selected["subType"]))
            : null;

        const selectedParentDetail = parentObj ? {
            id: String(parentObj.id),
            name: parentObj.name,
            price: parentObj.price || 0
        } : null;

        const selectedChildDetail = childObj ? {
            id: String(childObj.id),
            name: childObj.name,
            price: childObj.price || 0
        } : null;

        addToCart(product, selectedParentDetail, selectedChildDetail);
        onOpenChange(false);
    }, [variantsData, selected, addToCart, product, onOpenChange]);

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
                                    {product.nameUz}
                                </h3>
                                <div className="flex flex-col mt-0.5">
                                    {product.discountPrice && product.discountPrice < product.basePrice ? (
                                        <>
                                            <span className="text-[11px] text-slate-400 line-through font-medium leading-none">
                                                {product.basePrice.toLocaleString()} so'm
                                            </span>
                                            <span className="text-blue-500 font-bold text-[17px] leading-tight mt-0.5">
                                                {product.discountPrice.toLocaleString()} so'm
                                            </span>
                                        </>
                                    ) : (
                                        <p className="text-blue-500 font-bold text-[17px] leading-tight">
                                            {product.basePrice?.toLocaleString()} so'm
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Variant Selector ─────────────────────── */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-hide">
                            {hasVariants ? (
                                <MultiVariantSelector
                                    productId={String(product.id)}
                                    productName={product.nameUz}
                                    basePrice={product.discountPrice !== undefined && product.discountPrice < product.basePrice ? product.discountPrice : product.basePrice}
                                    variants={variantsData}
                                    onAddToCart={handleAddToCart}
                                />
                            ) : (
                                <ProductVariants
                                    productId={product.id}
                                    onOptionChange={setSelected}
                                    initialSelectedOptions={selected}
                                />
                            )}
                            {showErrors && !hasVariants && (
                                <p className="text-red-500 text-sm font-medium mt-4 animate-in fade-in slide-in-from-top-1">
                                    Iltimos, barcha variantlarni tanlang
                                </p>
                            )}
                        </div>

                        {/* ── Sticky Confirm Button - Hide when has variants ── */}
                        {!hasVariants && (
                            <div className="p-5 pt-3 shrink-0 border-t border-slate-100 bg-white">
                                {(product.stock === 0 || product.inStock === false || product.stock === 'Qolmagan') ? (
                                    <div className="w-full h-[52px] bg-slate-100 text-slate-400 rounded-2xl font-bold text-[15px] flex items-center justify-center shadow-sm">
                                        Sotuvda qolmagan
                                    </div>
                                ) : (
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
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
