import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetDescription,
} from "./ui/sheet";
import { type Product } from "../types";
import { Heart, ShieldCheck, Truck, ArrowLeft, ShoppingCart, Minus, Plus, Loader2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "../context/AuthContext";
import { useWishlist } from "../hooks/useWishlist";
import { useCart } from "../context/CartContext";
import { ProductVariants } from "./ProductVariants";
import { MultiVariantSelector } from "./MultiVariantSelector";
import { useProductVariants } from "../hooks/useProductVariants";
import { toast } from "sonner";
import VConsole from "vconsole";

interface ProductDetailsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product;
    isLoading?: boolean;
}

export function ProductDetailsDrawer({ open, onOpenChange, product, isLoading }: ProductDetailsDrawerProps) {
    const { user } = useAuthContext();
    const { isSaved, toggleWishlist } = useWishlist(user?.id);

    const saved = isSaved(product.id);
    const { addToCart, getItemQuantity, updateQuantity } = useCart();
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [_selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [extraVariantPrice, setExtraVariantPrice] = useState(0);

    const { data: variantsData = [], isLoading: isVariantsLoading } = useProductVariants(product.id);
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

    // 1. Initialize vConsole temporarily for debugging and destroy on unmount
    useEffect(() => {
        const vConsole = new VConsole();
        console.log("🛠️ [vConsole Initialized] on ProductDetailsDrawer mount.");
        
        return () => {
            vConsole.destroy();
            console.log("🛠️ [vConsole Destroyed] on ProductDetailsDrawer unmount.");
        };
    }, []);

    // 2. Explicitly print the full product and nested variantsData structure
    useEffect(() => {
        if (open) {
            console.log("📦 [DEBUG-API-PRODUCT] full product object from API:", product);
            console.log("🔗 [DEBUG-API-VARIANTS] nested variantsData tree structure:", variantsData);
        }
    }, [open, product, variantsData]);

    // Reset default selected image when opened
    useEffect(() => {
        if (open && product.images?.length) {
            const primaryIdx = product.images.findIndex(img => img.isPrimary);
            setSelectedImageIndex(primaryIdx >= 0 ? primaryIdx : 0);
        }
        if (open) {
            setSelectedOptions({});
            setExtraVariantPrice(0);
        }
    }, [open, product.images]);

    const mainImage = product.images?.[selectedImageIndex]?.url || product.image;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="w-full h-[95vh] sm:max-w-md sm:h-[95vh] sm:mx-auto sm:rounded-t-[2.5rem] rounded-t-[2.5rem] flex flex-col bg-white border-t border-slate-200 p-0 text-slate-900 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]"
            >
                {/* Accessibility: visually hidden title for Radix */}
                <SheetTitle className="sr-only">Mahsulot tafsilotlari</SheetTitle>
                <SheetDescription className="sr-only">Mahsulot haqida batafsil ma'lumot</SheetDescription>

                {/* Loading Spinner Overlay */}
                {(isLoading || isVariantsLoading) && (
                    <div className="absolute inset-0 z-[60] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-t-[2.5rem]">
                        <Loader2 className="w-8 h-8 text-[#007AFF] animate-spin" />
                        <span className="text-sm font-semibold text-slate-500">Yuklanmoqda...</span>
                    </div>
                )}

                {/* Sticky Header Actions */}
                <div className="flex justify-between items-center px-4 py-3 bg-white/90 backdrop-blur-xl border-b border-slate-100 z-50 shrink-0 sticky top-0 rounded-t-[2.5rem] shadow-sm">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" strokeWidth={2} />
                    </button>
                    <span className="font-bold text-slate-800 tracking-tight text-sm">Tafsilotlar</span>
                    <button
                        onClick={() => user?.id && toggleWishlist(product)}
                        disabled={!user?.id}
                        className={cn(
                            "w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center transition-colors shadow-sm",
                            user?.id ? "hover:bg-slate-50" : "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Heart className={`w-5 h-5 transition-colors ${saved ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} strokeWidth={saved ? 0 : 2} />
                    </button>
                </div>

                <ScrollArea className="flex-1">
                    {/* Hero Image & Gallery Layout */}
                    <div className="flex border-b border-slate-100 min-h-[40vh]">
                        {/* Lateral Thumbnails (Only show if multiple images) */}
                        {product.images && product.images.length > 1 && (
                            <div className="w-20 md:w-24 border-r border-slate-100 flex flex-col gap-2 p-3 overflow-y-auto max-h-[45vh] bg-slate-50/50">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={cn(
                                            "w-full aspect-square rounded-xl bg-white border flex items-center justify-center p-1.5 transition-all overflow-hidden shrink-0",
                                            selectedImageIndex === idx
                                                ? "border-[#007AFF] ring-1 ring-[#007AFF]/20 shadow-sm opacity-100"
                                                : "border-slate-200 hover:border-slate-300 opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <img src={img.url} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Main Hero Image */}
                        <div className="relative flex-1 w-full aspect-square max-h-[400px] md:max-h-[500px] bg-[#F8FAFC] flex items-center justify-center p-6 sm:p-10">
                            {/* Soft Ambient Light Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-[#E0F2F1] rounded-full blur-[80px] pointer-events-none opacity-60" />

                            {mainImage ? (
                                <img
                                    key={mainImage}
                                    src={mainImage}
                                    alt={product.nameUz}
                                    className="w-full h-full object-contain relative z-10 drop-shadow-xl saturate-110 animate-in fade-in zoom-in-95 duration-300"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center text-slate-300 font-bold tracking-widest uppercase text-sm z-10 relative">
                                    <span className="text-3xl mb-2 opacity-50">📷</span>
                                    Rasm yo'q
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-8 space-y-8">
                        {/* Title and Badge */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                {product.brand && (
                                    <span className="text-[11px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded border border-[#007AFF]/20 uppercase tracking-widest">
                                        {product.brand}
                                    </span>
                                )}
                                {product.status === 'Omborda bor' || product.stock === 'Omborda bor' ? (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1.5 uppercase tracking-widest shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Mavjud
                                    </span>
                                ) : product.stock && (
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">
                                        {product.stock}
                                    </span>
                                )}
                                {product.sku && (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded tracking-widest">
                                        SKU: {product.sku}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                                {product.nameUz}
                            </h1>
                            {(() => {
                                const finalBasePrice = (product.basePrice || 0) + extraVariantPrice;
                                const finalDiscountPrice = product.discountPrice !== undefined ? (product.discountPrice + extraVariantPrice) : undefined;
                                const hasDiscount = finalDiscountPrice !== undefined && finalDiscountPrice < finalBasePrice;

                                return hasDiscount ? (
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="text-[15px] text-slate-400 line-through font-medium leading-none">
                                            {finalBasePrice.toLocaleString()} so'm
                                        </span>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <p className="text-3xl font-black text-[#007AFF] leading-tight">
                                                {finalDiscountPrice!.toLocaleString()} so'm
                                            </p>
                                            {product.unit && (
                                                <span className="text-sm font-semibold text-slate-500">/ {product.unit}</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-black text-[#007AFF] leading-tight">
                                            {finalBasePrice.toLocaleString()} so'm
                                        </p>
                                        {product.unit && (
                                            <span className="text-sm font-semibold text-slate-500">/ {product.unit}</span>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

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
                                onOptionChange={setSelectedOptions}
                                onPriceChange={setExtraVariantPrice}
                            />
                        )}

                        {/* Description */}
                        {(product.descriptionUz || product.description) && (
                            <div className="bg-[#F8FAFC] border border-slate-200 rounded-[1.25rem] p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900 mb-3 tracking-wide uppercase">Tavsif</h3>
                                <p className="text-[15px] text-slate-600 font-normal leading-[1.6]">
                                    {product.descriptionUz || product.description}
                                </p>
                            </div>
                        )}

                        {/* Spec Table */}
                        {product.specs && product.specs.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide px-1">Texnik ma'lumotlar</h3>
                                <div className="bg-white border border-slate-200 rounded-[1.25rem] overflow-hidden shadow-sm">
                                    {product.specs.map((spec, idx) => (
                                        <div key={idx} className={`flex justify-between items-center p-4 text-[14px] ${idx !== (product.specs?.length ?? 0) - 1 ? 'border-b border-slate-100' : ''}`}>
                                            <span className="text-slate-500 font-medium">{spec.label}</span>
                                            <span className="text-slate-900 font-semibold text-right">{spec.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Trust Badges */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-white border border-slate-200 rounded-[1.25rem] p-5 flex flex-col items-center justify-center gap-3 text-center shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1">
                                    <ShieldCheck className="w-5 h-5" strokeWidth={2} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest leading-tight">Sifat<br />Kafolati</span>
                            </div>
                            <div className="flex-1 bg-white border border-slate-200 rounded-[1.25rem] p-5 flex flex-col items-center justify-center gap-3 text-center shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] mb-1">
                                    <Truck className="w-5 h-5" strokeWidth={2} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest leading-tight">Tezkor<br />Yetkazish</span>
                            </div>
                        </div>
                    </div>

                    {/* Padding for sticky footer */}
                    <div className="h-[80px]"></div>
                </ScrollArea>

                {/* Sticky CTA Footer - Hide when product has variants */}
                {!hasVariants && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 rounded-b-[2.5rem] sm:rounded-b-none z-50">
                        {(product.stock === 0 || product.inStock === false || product.stock === 'Qolmagan') ? (
                            <div className="w-full h-[52px] bg-slate-100 text-slate-400 rounded-2xl font-bold text-[15px] flex items-center justify-center shadow-sm">
                                Sotuvda qolmagan
                            </div>
                        ) : (() => {
                            const quantity = getItemQuantity(product.id);
                            return quantity === 0 ? (
                                <button
                                    onClick={() => addToCart(product)}
                                    className="w-full h-[52px] bg-[#007AFF] text-white rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#0062cc] active:scale-[0.98] transition-all shadow-sm"
                                >
                                    <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />
                                    Savatga
                                </button>
                            ) : (
                                <div className="w-full h-[52px] bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between p-1.5 shadow-inner">
                                    <button
                                        onClick={() => updateQuantity(product.id, Math.max(0, quantity - 1))}
                                        className="w-12 h-10 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 rounded-[0.8rem] shadow-sm transition-colors active:scale-95 border border-slate-200"
                                    >
                                        <Minus className="h-5 w-5" strokeWidth={2} />
                                    </button>
                                    <span className="text-lg font-black text-slate-900 tracking-wider">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => updateQuantity(product.id, quantity + 1)}
                                        className="w-12 h-10 flex items-center justify-center bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] rounded-[0.8rem] shadow-sm transition-colors active:scale-95 border border-[#007AFF]/20"
                                    >
                                        <Plus className="h-5 w-5" strokeWidth={2} />
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
