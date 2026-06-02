import { Heart, ShoppingCart, Minus, Plus, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ProductDetailsDrawer } from "./ProductDetailsDrawer";
import { AddToCartDrawer } from "./AddToCartBottomSheet";
import { cn } from "@/lib/utils";
import { useAuthContext } from "../context/AuthContext";
import { useWishlist } from "../hooks/useWishlist";
import { fetchProductById, fetchProductTypes } from "../services/api";
import { useProductVariants } from "../hooks/useProductVariants";
import { toast } from "sonner";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const {
        addToCart,
        getItemQuantity,
        updateQuantity
    } = useCart();

    const { user } = useAuthContext();
    const { isSaved, toggleWishlist } = useWishlist(user?.id);

    const saved = isSaved(product.id);
    const quantity = getItemQuantity(product.id);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [productDetails, setProductDetails] = useState<Product | null>(null);
    const { data: variantsData = [], isLoading: isVariantsLoading } = useProductVariants(product.id);
    const hasVariants = (variantsData && variantsData.length > 0) || isVariantsLoading;

    const primaryImageUrl = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || product.image;

    const isBaseOutOfStock = String(product.stock) === '0' || (product as any).inStock === false || product.stock === 'Qolmagan';
    const isAllVariantsOutOfStock = hasVariants && variantsData.length > 0 && variantsData.every((parent: any) => {
        const parentNoStock = (parent.stock ?? 0) === 0;
        const children = parent.children || parent.subTypes || [];
        if (children.length > 0) {
            return children.every((child: any) => (child.stock ?? 0) === 0);
        }
        return parentNoStock;
    });
    const isOutOfStock = hasVariants && variantsData.length > 0 ? isAllVariantsOutOfStock : isBaseOutOfStock;
    const handleBuyNow = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (hasVariants) {
            setIsBottomSheetOpen(true);
            toast.info("Iltimos, xarid qilish uchun mahsulot turini tanlang", { duration: 3000, position: 'top-center' });
        } else {
            const qty = Math.max(1, quantity);
            const payload = [{
                id: `${product.id}--`,
                productId: String(product.id),
                productNameUz: product.nameUz,
                quantity: qty,
                unitPrice: product.discountPrice !== undefined && product.discountPrice < product.basePrice ? product.discountPrice : product.basePrice,
                basePrice: product.basePrice,
                discountPrice: product.discountPrice,
                primaryImageUrl: primaryImageUrl || null,
                selectedParentType: null,
                selectedChildType: null
            }];
            window.dispatchEvent(new CustomEvent('openCheckout', { detail: { buyNowItem: payload } }));
        }
    };


    const handleCardClick = async () => {
        // Telegram haptic feedback
        try {
            (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
        } catch { }

        setIsDetailsLoading(true);
        setIsDetailsOpen(true);

        try {
            const [details, types] = await Promise.all([
                fetchProductById(product.id),
                fetchProductTypes(product.id),
            ]);

            console.info("🎯 [DEBUG-PRODUCT-FETCHED] =>", details);
            console.info("🎯 [DEBUG-TYPES-FETCHED] =>", types);

            setProductDetails(details);
        } catch (error) {
            console.error("❌ API Error:", error);
            // Fallback to existing product prop data if API fails
            setProductDetails(product);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const handleDetailsClose = (open: boolean) => {
        setIsDetailsOpen(open);
        if (!open) {
            // Clear fetched details when modal closes
            setProductDetails(null);
            setIsDetailsLoading(false);
        }
    };

    return (
        <>
            <div
                onClick={handleCardClick}
                className="group flex flex-col bg-white p-3 rounded-2xl border border-slate-200 relative hover:border-[#007AFF]/30 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 h-full cursor-pointer"
            >
                {/* Loading overlay when fetching details */}
                {isDetailsLoading && (
                    <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-[#007AFF] animate-spin" />
                    </div>
                )}

                {/* Image Area with soft medical blue backing */}
                <div className="relative w-full aspect-square bg-[#F1F5F9] group-hover:bg-[#E0F2F1]/50 rounded-xl overflow-hidden mb-3 shrink-0 transition-colors duration-300 flex items-center justify-center p-4">
                    {primaryImageUrl ? (
                        <img
                            src={primaryImageUrl}
                            alt={product.nameUz}
                            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 drop-shadow-sm"
                        />
                    ) : (
                        <div className="w-full h-full rounded-full bg-white/50 backdrop-blur-md border border-white shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center text-slate-400 font-bold tracking-widest uppercase text-[10px] text-center p-2 leading-tight">
                            <span className="text-xl mb-1 opacity-50">📷</span>
                            Rasm<br />yo'q
                        </div>
                    )}

                    {/* Like button: Minimalist heart */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (user?.id) toggleWishlist(product);
                        }}
                        disabled={!user?.id}
                        className={cn(
                            "absolute top-2 right-2 z-10 p-2 transition-all duration-200 outline-none rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm flex items-center justify-center",
                            user?.id ? "active:scale-90 hover:bg-white" : "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Heart className={cn("w-4 h-4 transition-colors", saved ? 'text-red-500 fill-red-500' : 'text-slate-400')} strokeWidth={saved ? 0 : 2} />
                    </button>
                </div>

                {/* Typography Area */}
                <div className="flex flex-col flex-1 px-1">
                    <div className="flex items-center justify-between mb-1">
                        {product.brand && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-widest">
                                {product.brand}
                            </span>
                        )}
                        {product.variants && (
                            <span className="text-[9px] text-[#007AFF] font-bold tracking-wide bg-[#007AFF]/10 px-1.5 py-0.5 rounded">
                                1x
                            </span>
                        )}
                    </div>

                    <h3 className="text-[14px] font-semibold text-slate-900 line-clamp-2 leading-snug min-h-10 tracking-tight mt-1">
                        {product.nameUz}
                    </h3>

                    <div className="flex flex-col gap-0.5 mt-2 mb-3 h-8">
                        {product.specs?.slice(0, 2).map((s, i) => (
                            <p key={i} className="text-[10px] text-slate-500 line-clamp-1 font-medium flex justify-between">
                                <span>{s.label}:</span>
                                <span className="text-slate-700 truncate ml-1 font-semibold">{s.value}</span>
                            </p>
                        ))}
                    </div>

                    <div className="mt-auto flex flex-col gap-1 min-h-[40px] justify-end">
                        {product.discountPrice && product.discountPrice < product.basePrice ? (
                            <>
                                <span className="text-[12px] text-slate-400 line-through font-medium leading-none">
                                    {product.basePrice.toLocaleString()} so'm
                                </span>
                                <span className="text-[16px] font-bold text-[#007AFF] leading-tight">
                                    {product.discountPrice.toLocaleString()} so'm
                                </span>
                            </>
                        ) : (
                            <span className="text-[16px] font-bold text-[#007AFF] leading-tight">
                                {product.basePrice !== undefined ? `${product.basePrice.toLocaleString()} so'm` : `${(0).toLocaleString()} so'm`}
                            </span>
                        )}
                    </div>

                    {/* Action Area */}
                    <div className="mt-3 h-10">
                        <AnimatePresence mode="wait" initial={false}>
                            {quantity === 0 ? (
                                <motion.div
                                    key="add-btn"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    {isOutOfStock ? (
                                        <div className="h-10 w-full bg-slate-100 text-slate-400 rounded-xl text-[12px] font-bold flex items-center justify-center transition-all p-0 shadow-sm cursor-not-allowed">
                                            Sotuvda yo'q
                                        </div>
                                    ) : (
                                        <div className="flex gap-1.5 w-full h-10">
                                            <Button
                                                onClick={handleBuyNow}
                                                className="h-10 flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all p-0 shadow-sm border border-slate-200/50"
                                            >
                                                <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                                                <span className="truncate leading-none">1 klikda</span>
                                            </Button>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    if (hasVariants) {
                                                        setIsBottomSheetOpen(true);
                                                    } else {
                                                        addToCart(product);
                                                    }
                                                }}
                                                className="h-10 flex-1 bg-[#007AFF] hover:bg-[#005bb5] text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all p-0 shadow-sm"
                                            >
                                                <ShoppingCart className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                                                <span className="truncate leading-none">Savatga</span>
                                            </Button>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="stepper"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex gap-1.5 w-full h-10"
                                >
                                    <Button
                                        onClick={handleBuyNow}
                                        className="h-10 flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all p-0 shadow-sm border border-slate-200/50"
                                    >
                                        <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                                        <span className="truncate leading-none">1 klikda</span>
                                    </Button>
                                    <div className="flex-1 h-10 rounded-xl flex items-center justify-between p-1 bg-white border border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            if (hasVariants) {
                                                setIsBottomSheetOpen(true);
                                            } else {
                                                const newQuantity = Math.max(0, quantity - 1);
                                                updateQuantity(product.id, newQuantity);
                                            }
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors active:scale-95 shrink-0"
                                    >
                                        <Minus className="h-4 w-4" strokeWidth={2.5} />
                                    </button>

                                    <span className="text-[13px] font-black text-slate-900 px-1 truncate tracking-widest">
                                        {quantity}
                                    </span>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            if (hasVariants) {
                                                setIsBottomSheetOpen(true);
                                            } else {
                                                const newQuantity = quantity + 1;
                                                updateQuantity(product.id, newQuantity);
                                            }
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] rounded-lg transition-colors active:scale-95 shrink-0"
                                    >
                                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                                    </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <ProductDetailsDrawer
                open={isDetailsOpen}
                onOpenChange={handleDetailsClose}
                product={productDetails || product}
                isLoading={isDetailsLoading}
            />

            <AddToCartDrawer
                open={isBottomSheetOpen}
                onOpenChange={setIsBottomSheetOpen}
                product={product}
            />
        </>
    );
}
