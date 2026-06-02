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

// ─── helpers ──────────────────────────────────────────────────────────────────

function getUnitPrice(item: any): number {
    const base =
        item.discountPrice !== undefined &&
        item.discountPrice !== null &&
        item.discountPrice < (item.basePrice || 0)
            ? item.discountPrice
            : item.basePrice || item.unitPrice || 0;
    return base + (item.selectedParentType?.price || 0) + (item.selectedChildType?.price || 0);
}

function formatPrice(price: number) {
    return price.toLocaleString() + " so'm";
}

// ─── component ────────────────────────────────────────────────────────────────

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
    const { cart, updateQuantity, removeFromCart, cartCount, cartTotal, refetchCart } = useCart();

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isEditLoading, setIsEditLoading] = useState(false);

    // Re-render when a variant is saved in another component
    const [, setRefreshTick] = useState(0);
    useEffect(() => {
        const handler = () => setRefreshTick(t => t + 1);
        window.addEventListener("variantSaved", handler);
        return () => window.removeEventListener("variantSaved", handler);
    }, []);

    // Refetch server cart when drawer opens
    useEffect(() => {
        if (open) refetchCart();
    }, [open, refetchCart]);

    // ── Group flat cart rows by productId ──────────────────────────────────────
    // Each group = { productId, rows: CartItem[], groupTotal, image, name }
    const groupedCart = useMemo(() => {
        const order: string[] = [];
        const map: Record<string, { rows: any[] }> = {};

        cart.forEach((item: any) => {
            if (!map[item.productId]) {
                order.push(item.productId);
                map[item.productId] = { rows: [] };
            }
            map[item.productId].rows.push(item);
        });

        return order.map(productId => {
            const { rows } = map[productId];
            const first = rows[0];
            const groupTotal = rows.reduce(
                (sum: number, row: any) => sum + getUnitPrice(row) * row.quantity,
                0
            );
            return {
                productId,
                name: first.productNameUz || "Mahsulot",
                image: first.primaryImageUrl || null,
                rows,
                groupTotal,
            };
        });
    }, [cart]);

    // ── Edit handler ───────────────────────────────────────────────────────────
    const handleEditItem = async (productId: string) => {
        if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.HapticFeedback) {
            (window as any).Telegram.WebApp.HapticFeedback.impactOccurred("light");
        }
        setIsEditLoading(true);
        setIsEditDrawerOpen(true);
        try {
            const product = await fetchProductById(productId);
            setEditingProduct(product);
        } catch {
            setIsEditDrawerOpen(false);
        } finally {
            setIsEditLoading(false);
        }
    };

    // ── render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-white border-l border-slate-200 p-0 text-slate-900 shadow-[-10px_0_40px_rgba(0,0,0,0.05)]">

                    {/* ── Header ── */}
                    <SheetHeader className="px-5 py-5 border-b border-slate-100 flex flex-row items-center gap-3 space-y-0 bg-white/80 backdrop-blur-xl shrink-0 sticky top-0 z-10">
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

                    {/* ── Empty state ── */}
                    {cart.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                            <div className="relative mb-8 group">
                                <div className="absolute inset-0 bg-[#007AFF]/5 rounded-full blur-3xl group-hover:bg-[#007AFF]/10 transition-colors duration-1000" />
                                <div className="w-32 h-32 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.03)] relative z-10 hover:scale-105 transition-transform duration-700">
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
                            {/* ── Grouped item list ── */}
                            <ScrollArea className="flex-1 px-4 py-5">
                                <div className="flex flex-col gap-3">
                                    <AnimatePresence initial={false}>
                                        {groupedCart.map(group => (
                                            <motion.div
                                                key={group.productId}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                                            >
                                                {/* ── Product header row (image + name + edit) ── */}
                                                <div
                                                    className="flex gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors group"
                                                    onClick={() => handleEditItem(group.productId)}
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-[#F8FAFC] shrink-0 border border-slate-100 p-1.5 flex items-center justify-center relative">
                                                        {group.image ? (
                                                            <img
                                                                src={group.image}
                                                                alt={group.name}
                                                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-sm"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-300 font-bold uppercase text-center leading-none">
                                                                Rasm<br />yo'q
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl flex items-center justify-center">
                                                            <Pencil className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-70 transition-opacity" strokeWidth={2.5} />
                                                        </div>
                                                    </div>

                                                    {/* Name */}
                                                    <div className="flex-1 flex items-center min-w-0">
                                                        <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-[#007AFF] transition-colors">
                                                            {group.name}
                                                        </h4>
                                                    </div>
                                                </div>

                                                {/* ── Variant sub-rows ── */}
                                                <div className="px-3 pb-3 flex flex-col gap-2">
                                                    {group.rows.map((row: any) => {
                                                        const unitPrice = getUnitPrice(row);
                                                        const rowTotal = unitPrice * row.quantity;
                                                        const variantLabel = (() => {
                                                            const parent = row.selectedParentType?.name;
                                                            const child = row.selectedChildType?.name;
                                                            if (parent && child) return `${parent} ➔ ${child}`;
                                                            if (parent) return parent;
                                                            return null;
                                                        })();

                                                        return (
                                                            <div
                                                                key={row.id}
                                                                className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl px-3 py-2.5 border border-slate-100"
                                                            >
                                                                {/* Variant label + price */}
                                                                <div className="flex-1 min-w-0">
                                                                    {variantLabel ? (
                                                                        <p className="text-xs font-semibold text-slate-600 truncate">
                                                                            {variantLabel}
                                                                        </p>
                                                                    ) : (
                                                                        <p className="text-xs font-semibold text-slate-400 italic">
                                                                            Asosiy
                                                                        </p>
                                                                    )}
                                                                    <p className="text-xs font-bold text-[#007AFF] mt-0.5">
                                                                        {formatPrice(rowTotal)}
                                                                    </p>
                                                                </div>

                                                                {/* Individual qty controls */}
                                                                <div className="flex items-center gap-1.5 bg-white rounded-lg p-1 border border-slate-200 shadow-sm shrink-0">
                                                                    <button
                                                                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-50 text-slate-600 transition-all active:scale-95 border border-slate-200"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateQuantity(row.id, Math.max(0, row.quantity - 1));
                                                                        }}
                                                                    >
                                                                        <Minus className="w-3 h-3" strokeWidth={2.5} />
                                                                    </button>
                                                                    <span className="w-5 text-center text-xs font-black text-slate-900 tracking-wider">
                                                                        {row.quantity}
                                                                    </span>
                                                                    <button
                                                                        className="w-6 h-6 flex items-center justify-center rounded-md bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] transition-all active:scale-95 border border-[#007AFF]/20"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateQuantity(row.id, row.quantity + 1);
                                                                        }}
                                                                    >
                                                                        <Plus className="w-3 h-3" strokeWidth={2.5} />
                                                                    </button>
                                                                </div>

                                                                {/* Delete this variant row */}
                                                                <button
                                                                    className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-100 rounded-lg transition-all shadow-sm shrink-0"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        removeFromCart(row.id);
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* ── Group total (shown only when 2+ rows or always) ── */}
                                                    {group.rows.length > 1 && (
                                                        <div className="flex justify-between items-center pt-1.5 px-1">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                                Jami
                                                            </span>
                                                            <span className="text-sm font-black text-slate-900">
                                                                {formatPrice(group.groupTotal)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </ScrollArea>

                            {/* ── Footer summary + actions ── */}
                            <div className="p-6 bg-white border-t border-slate-200 mt-auto shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                        <span>Mahsulotlar soni</span>
                                        <span className="text-slate-900 text-[13px] font-bold">{cartCount} ta</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Jami narx</span>
                                        <span className="text-2xl font-black text-slate-900 tracking-tight">{formatPrice(cartTotal)}</span>
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
                    if (!val) onOpenChange(false);
                }}
                onRequireVariant={(productId) => {
                    setIsCheckoutOpen(false);
                    handleEditItem(productId);
                }}
            />

            {/* Product Details Drawer (edit variants) */}
            {editingProduct && (
                <ProductDetailsDrawer
                    open={isEditDrawerOpen}
                    onOpenChange={(val) => {
                        setIsEditDrawerOpen(val);
                        if (!val) setEditingProduct(null);
                    }}
                    product={editingProduct}
                    isLoading={isEditLoading}
                />
            )}
        </>
    );
}
