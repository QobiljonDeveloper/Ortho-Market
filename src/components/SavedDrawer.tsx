import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "./ui/sheet";
import { ScrollArea } from "./ui/scroll-area";
import { WishlistCard } from "./WishlistCard";
import { useAuthContext } from "../context/AuthContext";
import { useWishlist } from "../hooks/useWishlist";
import { Heart, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SavedDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SavedDrawer({ open, onOpenChange }: SavedDrawerProps) {
    const { user } = useAuthContext();
    const { wishlist = [], removeFromWishlist } = useWishlist(user?.id);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="w-full h-[90vh] sm:max-w-md sm:h-[95vh] sm:mx-auto sm:rounded-t-4xl rounded-t-4xl flex flex-col bg-[#F8FAFC] border-t border-slate-200 p-0 text-slate-900 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <SheetDescription className="sr-only">Sevimli mahsulotlar ro'yxati</SheetDescription>
                <SheetHeader className="px-6 py-5 border-b border-slate-200 bg-white/80 backdrop-blur-xl shrink-0 sticky top-0 z-10 rounded-t-4xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
                                <Heart className="w-5 h-5 text-red-500 fill-red-500/20" strokeWidth={1.5} />
                            </div>
                            <div className="flex flex-col">
                                <SheetTitle className="text-xl font-bold tracking-tight text-slate-900">
                                    Sevimlilar
                                </SheetTitle>
                                {wishlist.length > 0 && (
                                    <span className="text-xs font-medium text-slate-500">
                                        {wishlist.length} ta mahsulot
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {wishlist.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                            >
                                <div className="relative mb-8 group">
                                    <div className="absolute inset-0 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors duration-1000" />
                                    <div className="w-32 h-32 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.03)] relative z-10 transition-transform duration-700 hover:scale-105">
                                        <Heart className="w-12 h-12 text-slate-200" strokeWidth={1} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">
                                    Sevimlilar ro'yxati bo'sh
                                </h3>
                                <p className="text-slate-500 max-w-[280px] leading-relaxed font-medium">
                                    O'zingizga yoqqan mahsulotlarni yurakcha tugmasini bosib saqlab qo'ying.
                                </p>
                                <button
                                    onClick={() => onOpenChange(false)}
                                    className="mt-10 bg-[#007AFF] hover:bg-[#005bb5] text-white font-bold px-8 py-3.5 rounded-full shadow-sm transition-all active:scale-95 flex items-center gap-2.5"
                                >
                                    <ShoppingBag className="w-4.5 h-4.5" strokeWidth={2} />
                                    Xaridni boshlash
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="content"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full"
                            >
                                <ScrollArea className="h-full px-4 py-6">
                                    <div className="grid grid-cols-2 gap-3 pb-8">
                                        <AnimatePresence>
                                            {wishlist.map((item) => (
                                                <motion.div
                                                    key={item.productId}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <WishlistCard
                                                        item={item}
                                                        onRemove={removeFromWishlist}
                                                    />
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </ScrollArea>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </SheetContent>
        </Sheet>
    );
}
