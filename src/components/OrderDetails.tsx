import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, MapPin, CreditCard, Package } from 'lucide-react';

const REGION_MAP: Record<number, string> = {
    0: "Toshkent",
    1: "Toshkent viloyati",
    2: "Samarqand",
    3: "Buxoro",
    4: "Andijon",
    5: "Farg'ona",
    6: "Namangan",
    7: "Qashqadaryo",
    8: "Surxondaryo",
    9: "Xorazm",
    10: "Navoiy",
    11: "Jizzax",
    12: "Sirdaryo",
    13: "Qoraqalpog'iston"
};

export function OrderDetails() {
    const [open, setOpen] = useState(false);
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        const handler = (e: any) => {
            if (e.detail) {
                setOrder(e.detail);
                setOpen(true);
            }
        };
        window.addEventListener('open-order-details', handler);
        return () => window.removeEventListener('open-order-details', handler);
    }, []);

    if (!order) return null;

    const formatPrice = (price: number) => {
        return price ? price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS" : "0 UZS";
    };

    const isDelivery = order.deliveryMethod === 1;
    // In actual response or payload, we map address dynamically. If it was a generic payload map we guess
    const regionName = order.address?.region !== undefined ? (REGION_MAP[order.address.region] || order.address.region) : "Samarqand";
    const fullAddress = order.address ? `${regionName}, ${order.address.city || ""}, ${order.address.street || ""}` : "Samarqand (O'zi olib ketish)";

    // Status mapping
    const statusText = order.status === 0 ? "Qabul qilindi" : order.status === 1 ? "Yo'lda" : order.status === 2 ? "Yetkazib berildi" : order.status || "Qabul qilindi";

    const subTotal = order.items?.reduce((ttl: number, i: any) => ttl + (i.quantity * (i.unitPrice || i.price || 0)), 0) || order.totalAmount || 0;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col w-full h-full overflow-y-auto font-sans"
                >
                    <div className="flex items-center justify-between p-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                            </div>
                            <span className="font-bold text-slate-900 tracking-tight text-lg">Buyurtma qabul qilindi</span>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="p-2 -mr-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400"
                        >
                            <X className="w-6 h-6" strokeWidth={1.5} />
                        </button>
                    </div>

                    <div className="px-5 pb-8 pt-6 flex-1 flex flex-col max-w-lg mx-auto w-full space-y-6">
                        {/* Order Header */}
                        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-1 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-[40px] pointer-events-none" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest break-all">Order Number: {order.id && String(order.id).includes('ORD-') ? order.id : `ORD-20260329-${String(order.id).slice(-4)}`}</span>
                            <span className="text-xl font-black text-emerald-600">Status: {statusText}</span>
                        </div>

                        {/* Items List */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide ml-1 flex items-center gap-2">
                                <Package className="w-4 h-4 text-[#007AFF]" /> Mahsulotlar
                            </h3>
                            <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-sm space-y-2">
                                {order.items?.map((item: any, idx: number) => {
                                    const prodName = item.product?.name || item.name || "Ortodontik mahsulot";
                                    const sku = item.product?.sku || item.sku || "OM-002";
                                    const qty = item.quantity || 1;
                                    const unitPrice = item.unitPrice || item.price || 0;
                                    const itemTotal = qty * unitPrice;
                                    return (
                                        <div key={idx} className="flex gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{prodName}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">SKU: {sku}</p>
                                                <p className="text-xs font-medium text-slate-500 mt-2">{qty} x {formatPrice(unitPrice)}</p>
                                            </div>
                                            <div className="flex flex-col items-end justify-center">
                                                <span className="text-sm font-black text-[#007AFF]">{itemTotal > 0 ? formatPrice(itemTotal) : "Hisoblanmoqda"}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide ml-1 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#007AFF]" /> Yetkazib berish
                            </h3>
                            <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm flex flex-col gap-1">
                                <span className="text-sm font-bold text-slate-900">{isDelivery ? (order.address?.label || "Uy manzili") : "O'zi olib ketish (Samarqand filial)"}</span>
                                <span className="text-xs font-medium text-slate-500 leading-relaxed">{fullAddress}</span>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide ml-1 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-[#007AFF]" /> To'lov
                            </h3>
                            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-500">Oraliq summa</span>
                                    <span className="font-bold text-slate-900">{formatPrice(subTotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-500">Yetkazib berish</span>
                                    <span className="font-bold text-slate-900">{isDelivery ? "Bepul" : "0 UZS"}</span>
                                </div>
                                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-xs font-black uppercase text-slate-400">Jami to'lov</span>
                                    <span className="text-xl font-black text-[#007AFF]">{formatPrice(order.totalAmount || subTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
