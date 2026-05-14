import { useState, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { Button } from "./ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "./ui/sheet";
import { ScrollArea } from "./ui/scroll-area";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Pencil } from "lucide-react";
import { CheckoutDrawer } from "./CheckoutDrawer";
import { ProductDetailsDrawer } from "./ProductDetailsDrawer";
import { motion, AnimatePresence } from "framer-motion";
import { fetchProductById } from "../services/api";
import type { Product } from "../types";

interface CartDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
    const { cart, updateQuantity, removeFromCart, cartCount, refetchCart } = useCart();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // Product details modal state for editing variants
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isEditLoading, setIsEditLoading] = useState(false);

    const VARIANTS_STORAGE_KEY = 'tg_cart_variants';

    const [refreshCartTrigger, setRefreshCartTrigger] = useState(0);

    useEffect(() => {
        const handleVariantSaved = () => setRefreshCartTrigger(prev => prev + 1);
        window.addEventListener('variantSaved', handleVariantSaved);
        return () => window.removeEventListener('variantSaved', handleVariantSaved);
    }, []);

    const cartItemsWithDynamicPrices = useMemo(() => {
        const _trigger = refreshCartTrigger; // register dependency
        const savedVariantsStr = localStorage.getItem(VARIANTS_STORAGE_KEY);
        const storedVariants = savedVariantsStr ? JSON.parse(savedVariantsStr) : {};

        return cart.map((item: any) => {
            const variantData = storedVariants[String(item.productId)];
            const extraPrice = (variantData?.parentPrice || 0) + (variantData?.childPrice || 0);

            const basePrice = item.basePrice || item.unitPrice || 0;
            const unitPrice = item.unitPrice || item.basePrice || 0;

            const finalBasePrice = basePrice + extraPrice;
            const finalUnitPrice = unitPrice + extraPrice;
            const hasDiscount = unitPrice < basePrice;

            return {
                ...item,
                displayPrice: finalUnitPrice,
                originalPrice: finalBasePrice,
                hasDiscount,
                variantData
            };
        });
    }, [cart, refreshCartTrigger]);

    const dynamicCartTotal = useMemo(() => {
        return cartItemsWithDynamicPrices.reduce((total: number, item: any) => total + (item.displayPrice * item.quantity), 0);
    }, [cartItemsWithDynamicPrices]);

    useEffect(() => {
        if (open) {
            refetchCart();
        }
    }, [open, refetchCart]);

    const formatPrice = (price: number) => {
        return price.toLocaleString() + " so'm";
    };

    const handleEditItem = async (productId: string) => {
        // Trigger Telegram light haptic feedback
        if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.HapticFeedback) {
            (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }

        setIsEditLoading(true);
        setIsEditDrawerOpen(true);
        try {
            const product = await fetchProductById(productId);
            setEditingProduct(product);
        } catch (err) {
            console.error("Failed to fetch product details:", err);
            setIsEditDrawerOpen(false);
        } finally {
            setIsEditLoading(false);
        }
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-white border-l border-slate-200 p-0 text-slate-900 shadow-[-10px_0_40px_rgba(0,0,0,0.05)]">
                    <SheetHeader className="px-5 py-5 border-b border-slate-100 flex flex-row items-center gap-3 space-y-0 bg-white/80 backdrop-blur-xl shrink-0 sticky top-0 z-10 transition-all">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm"
                            onClick={() => onOpenChange(false)}
                        >
                            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
                        </Button>
                        <SheetTitle className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900 m-0">
                            <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center border border-[#007AFF]/20">
                                <ShoppingBag className="w-5 h-5 text-[#007AFF]" strokeWidth={2} />
                            </div>
                            Savat
                        </SheetTitle>
                        <SheetDescription className="sr-only">
                            Savatdagi mahsulotlar ro'yxati
                        </SheetDescription>
                    </SheetHeader>

                    {cart.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                            <div className="relative mb-8 group">
                                <div className="absolute inset-0 bg-[#007AFF]/5 rounded-full blur-3xl group-hover:bg-[#007AFF]/10 transition-colors duration-1000" />
                                <div className="w-32 h-32 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.03)] relative z-10 transition-transform duration-700 hover:scale-105">
                                    <ShoppingBag className="w-12 h-12 text-slate-200" strokeWidth={1} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">
                                Savatingiz bo'sh
                            </h3>
                            <p className="text-slate-500 max-w-[280px] leading-relaxed font-medium mb-10">
                                Hali hech narsa tanlamadingiz. Katalogimizdan o'zingizga kerakli narsalarni toping.
                            </p>
                            <Button
                                onClick={() => onOpenChange(false)}
                                className="bg-white hover:bg-slate-50 text-slate-900 font-bold px-8 py-3.5 rounded-full border border-slate-200 shadow-sm transition-all active:scale-95"
                            >
                                Katalogga qaytish
                            </Button>
                        </div>
                    ) : (
                        <>
                            <ScrollArea className="flex-1 px-4 py-6">
                                <div className="flex flex-col gap-3">
                                    <AnimatePresence initial={false}>
                                        {cartItemsWithDynamicPrices.map((item: any) => {
                                            if (!item) return null;
                                            const variant = item.variantData;
                                            return (
                                                <motion.div
                                                    key={item.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    onClick={() => handleEditItem(item.productId)}
                                                    className="bg-white p-3 rounded-2xl border border-slate-100 flex gap-4 transition-all hover:bg-slate-50 hover:border-slate-200 group shadow-sm cursor-pointer active:scale-[0.98]"
                                                >
                                                    {/* Clickable image area — opens product modal */}
                                                    <div
                                                        className="h-20 w-20 rounded-xl overflow-hidden bg-[#F8FAFC] shrink-0 border border-slate-100 p-2 flex items-center justify-center relative group/img"
                                                    >
                                                        {(() => {
                                                            const imgUrl = item.primaryImageUrl;
                                                            return imgUrl ? (
                                                                <img src={imgUrl} alt={item.productNameUz || "Mahsulot"} className="w-full h-full object-contain group-hover/img:scale-110 transition-transform duration-500 drop-shadow-sm" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300 font-bold uppercase text-center leading-none">
                                                                    Rasm<br />yo'q
                                                                </div>
                                                            );
                                                        })()}
                                                        {/* Edit overlay hint */}
                                                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors rounded-xl flex items-center justify-center">
                                                            <Pencil className="w-4 h-4 text-white opacity-0 group-hover/img:opacity-70 transition-opacity" strokeWidth={2.5} />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col flex-1 py-0.5 justify-between">
                                                        <div className="flex justify-between gap-2.5 items-start">
                                                            <div className="flex-1">
                                                                <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-[#007AFF] transition-colors">
                                                                    {item.productNameUz}
                                                                </h4>
                                                                {/* Variant display */}
                                                                {variant && (
                                                                    <p className="text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                                                                        Variant: {variant.parentName} {variant.childName ? `➔ ${variant.childName}` : ''}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeFromCart(item.productId);
                                                                }}
                                                                className="text-slate-300 hover:text-red-500 bg-white border border-slate-100 hover:bg-red-50 hover:border-red-100 rounded-lg p-1.5 transition-all shadow-sm shrink-0"
                                                            >
                                                                <Trash2 className="w-4 h-4" strokeWidth={2} />
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center justify-between mt-2 min-h-[38px]">
                                                            <div className="flex flex-col justify-end gap-0.5">
                                                                {item.hasDiscount ? (
                                                                    <>
                                                                        <span className="text-[11px] text-slate-400 line-through font-medium leading-none">
                                                                            {formatPrice(item.originalPrice)}
                                                                        </span>
                                                                        <span className="font-bold text-[#007AFF] text-sm leading-tight mt-0.5">
                                                                            {formatPrice(item.displayPrice)}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span className="font-bold text-[#007AFF] text-sm leading-tight">
                                                                        {formatPrice(item.displayPrice)}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-lg p-1 border border-slate-100">
                                                                <button
                                                                    className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-slate-50 text-slate-700 transition-all active:scale-95 border border-slate-200 shadow-sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        updateQuantity(item.productId, Math.max(0, item.quantity - 1));
                                                                    }}
                                                                >
                                                                    <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                                </button>
                                                                <span className="w-5 text-center text-xs font-black text-slate-900 tracking-wider">
                                                                    {item.quantity}
                                                                </span>
                                                                <button
                                                                    className="w-7 h-7 flex items-center justify-center rounded-md bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] transition-all active:scale-95 border border-[#007AFF]/20 shadow-sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        updateQuantity(item.productId, item.quantity + 1);
                                                                    }}
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </ScrollArea>

                            <div className="p-6 bg-white border-t border-slate-200 mt-auto shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                        <span>Mahsulotlar soni</span>
                                        <span className="text-slate-900 text-[13px] font-bold">{cartCount} ta</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Jami narx</span>
                                        <span className="text-2xl font-black text-slate-900 tracking-tight">{formatPrice(dynamicCartTotal)}</span>
                                    </div>
                                </div>

                                <SheetFooter className="gap-3 flex-col items-stretch">
                                    <Button
                                        className="w-full rounded-full h-14 text-base font-bold bg-[#007AFF] hover:bg-[#005bb5] text-white shadow-[0_8px_20px_rgba(0,122,255,0.2)] hover:shadow-[0_10px_25px_rgba(0,122,255,0.3)] transition-all flex items-center justify-center gap-2"
                                        onClick={() => setIsCheckoutOpen(true)}
                                    >
                                        Rasmiylashtirish
                                        <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="w-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 h-10 font-bold transition-all text-xs uppercase tracking-widest"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        Davom etish
                                    </Button>
                                </SheetFooter>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {/* Checkout Drawer */}
            <CheckoutDrawer
                open={isCheckoutOpen}
                onOpenChange={(val) => {
                    setIsCheckoutOpen(val);
                    if (!val) {
                        onOpenChange(false);
                    }
                }}
                onRequireVariant={(productId) => {
                    setIsCheckoutOpen(false);
                    handleEditItem(productId);
                }}
            />

            {/* Product Details Drawer for editing variants */}
            {editingProduct && (
                <ProductDetailsDrawer
                    open={isEditDrawerOpen}
                    onOpenChange={(val) => {
                        setIsEditDrawerOpen(val);
                        if (!val) {
                            setEditingProduct(null);
                        }
                    }}
                    product={editingProduct}
                    isLoading={isEditLoading}
                />
            )}
        </>
    );
}
