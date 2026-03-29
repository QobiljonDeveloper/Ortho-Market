import { Trash2, ShoppingCart, Plus, Minus } from "lucide-react";
import type { WishlistItem } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Button } from "./ui/button";

interface WishlistCardProps {
    item: WishlistItem;
    onRemove: (productId: string) => void;
}

export function WishlistCard({ item, onRemove }: WishlistCardProps) {
    const navigate = useNavigate();
    const { addToCart, updateQuantity, getItemQuantity } = useCart();

    const formattedPrice = item.basePrice?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") || "0";
    const quantity = getItemQuantity(item.productId);

    return (
        <motion.div
            layout
            onClick={() => navigate(`/product/${item.productId}`)}
            className="group flex flex-col bg-white p-3 rounded-2xl border border-slate-200 relative hover:border-[#007AFF]/30 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 h-full cursor-pointer"
        >
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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-10 h-10 mb-1.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                            Rasm yo'q
                        </span>
                    </div>
                )}

                {/* Persistent Trash / Remove Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onRemove(item.productId);
                    }}
                    className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all duration-200 active:scale-90 opacity-100"
                    aria-label="O'chirish"
                >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                </button>
            </div>

            {/* Product Info */}
            <div className="flex flex-col flex-1 px-1">
                <h3 className="text-[14px] font-semibold text-slate-900 line-clamp-2 leading-snug min-h-10 tracking-tight">
                    {item.productNameUz}
                </h3>

                <span className="text-[16px] font-bold text-[#007AFF] mt-1 pt-1 whitespace-nowrap">
                    {formattedPrice} so'm
                </span>

                {/* Action Area (Add to Cart / Counter) */}
                <div className="mt-auto h-10 w-full">
                    <AnimatePresence mode="wait" initial={false}>
                        {quantity === 0 ? (
                            <motion.div
                                key="add-btn"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        addToCart({
                                            id: item.productId,
                                            nameUz: item.productNameUz,
                                            name: item.productNameUz,
                                            basePrice: item.basePrice || 0,
                                            price: `${item.basePrice || 0} so'm`,
                                            images: [{ url: item.primaryImageUrl || "", isPrimary: true }],
                                            image: item.primaryImageUrl || ""
                                        } as any);
                                    }}
                                    className="h-10 w-full bg-[#007AFF] hover:bg-[#005bb5] text-white rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all p-0 shadow-sm"
                                >
                                    <ShoppingCart className="w-4 h-4" strokeWidth={2.5} />
                                    Savatga
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="stepper"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="h-10 w-full rounded-xl flex items-center justify-between p-1 bg-white border border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        updateQuantity(item.productId, Math.max(0, quantity - 1));
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
                                        updateQuantity(item.productId, quantity + 1);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] rounded-lg transition-colors active:scale-95 shrink-0"
                                >
                                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
