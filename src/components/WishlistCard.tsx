import { Trash2, ShoppingCart } from "lucide-react";
import type { WishlistItem } from "../types";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface WishlistCardProps {
    item: WishlistItem;
    onRemove: (productId: string) => void;
}

export function WishlistCard({ item, onRemove }: WishlistCardProps) {
    const { addToCart } = useCart();
    // Explicit format matching "217 600 so'm"
    const formattedPrice = item.basePrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        addToCart({
            id: item.productId,
            nameUz: item.productNameUz,
            priceValue: item.basePrice,
            primaryImageUrl: item.primaryImageUrl,
        } as any);

        toast.success("Savatga qo'shildi", { duration: 2000, position: 'bottom-left' });
    };

    return (
        <motion.div
            layout
            className="group flex flex-col bg-white p-3 rounded-2xl border border-slate-200 relative hover:border-[#007AFF]/30 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 h-full"
        >
            {/* Trash / Remove Button (Now persistent and always visible) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onRemove(item.productId);
                }}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all duration-200 active:scale-90"
                aria-label="O'chirish"
            >
                <Trash2 className="w-4 h-4" strokeWidth={2} />
            </button>

            <Link to={`/product/${item.productId}`} className="flex flex-col flex-1 relative z-10 w-full">
                {/* Image */}
                <div className="relative w-full aspect-square bg-[#F1F5F9] rounded-xl overflow-hidden mb-3 shrink-0 transition-colors duration-300 flex items-center justify-center p-3">
                    {item.primaryImageUrl ? (
                        <img
                            src={item.primaryImageUrl}
                            alt={item.productNameUz}
                            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 drop-shadow-sm"
                        />
                    ) : (
                        <div className="w-full h-full rounded-xl bg-white/60 backdrop-blur-md border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-slate-300">
                            <span className="text-[12px] font-black tracking-widest uppercase text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                RASM YO'Q
                            </span>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col flex-1 px-1">
                    <h3 className="text-[14px] font-semibold text-slate-900 line-clamp-2 leading-snug min-h-10 tracking-tight group-hover:text-[#007AFF] transition-colors">
                        {item.productNameUz}
                    </h3>
                </div>
            </Link>

            {/* Bottom Row: Price & Add to Cart */}
            <div className="flex items-end justify-between px-1 mt-3 relative z-20">
                <span className="text-[16px] font-bold text-[#007AFF] whitespace-nowrap">
                    {formattedPrice} so'm
                </span>

                <button
                    onClick={handleAddToCart}
                    className="p-2.5 rounded-xl bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF] hover:text-white transition-colors duration-200 flex items-center justify-center active:scale-95"
                    aria-label="Savatga qo'shish"
                >
                    <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />
                </button>
            </div>
        </motion.div>
    );
}
