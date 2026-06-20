import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, MapPin, CreditCard, Package } from 'lucide-react';
import { fetchProductById } from '../services/api';
import { calcOrderItemUnitPrice, calcOrderTotal, formatSom } from '../utils/calculateTotal';

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
    const [productsMap, setProductsMap] = useState<Record<string, any>>({});

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

    // Fetch product details for all items in the order
    useEffect(() => {
        if (!order?.items || order.items.length === 0) return;
        const productIds = new Set<string>();
        order.items.forEach((item: any) => {
            if (item.productId) productIds.add(item.productId);
        });

        const fetchAll = async () => {
            const map: Record<string, any> = {};
            await Promise.all(
                Array.from(productIds).map(async (pid) => {
                    try {
                        const product = await fetchProductById(pid);
                        map[pid] = product;
                    } catch (e) {
                        console.warn("Failed to fetch product:", pid, e);
                    }
                })
            );
            setProductsMap(map);
        };
        fetchAll();
    }, [order]);

    if (!order) return null;

    const formatPrice = (price: number) => {
        return formatSom(price || 0);
    };

    const isDelivery = order.deliveryMethod === 1;
    // In actual response or payload, we map address dynamically. If it was a generic payload map we guess
    const regionName = order.address?.region !== undefined ? (REGION_MAP[order.address.region] || order.address.region) : "Samarqand";
    const fullAddress = order.address ? `${regionName}, ${order.address.city || ""}, ${order.address.street || ""}` : "Samarqand (O'zi olib ketish)";

    // Status mapping
    const statusText = order.status === 0 ? "Qabul qilindi" : order.status === 1 ? "Tayyorlanmoqda" : order.status === 2 ? "Yo'lda" : order.status === 3 ? "Yetkazib berildi" : order.status || "Qabul qilindi";
    const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' }) : "";

    const paymentStatus = order.paymentStatus || 0;
    let paymentBadge = null;
    if (paymentStatus === 0) {
        paymentBadge = <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1 inline-block">To'lanmagan</span>;
    } else if (paymentStatus === 1) {
        paymentBadge = <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1 inline-block">To'langan</span>;
    } else if (paymentStatus === 2) {
        paymentBadge = <span className="bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1 inline-block">Qaytarilgan</span>;
    }

    // Helper: reconstruct full item price using fetched productsMap.
    // discountPrice IS the final adjusted price — not a discount amount to subtract.
    const getFullItemPrice = (item: any) => {
        return calcOrderItemUnitPrice(item, productsMap);
    };

    // For strikethrough display: reconstruct the original (pre-discount) base price.
    const getFullBasePrice = (item: any) => {
        const rawPrice = item.unitPrice || 0;
        const hasVariant = !!(item.productTypeId || item.typeId);
        if (!hasVariant) return rawPrice;

        const product = productsMap[item.productId];
        if (!product?.basePrice) return rawPrice;

        return rawPrice + product.basePrice;
    };

    const subTotal = calcOrderTotal(order.items || [], productsMap) || order.totalAmount || 0;
    const finalTotal = subTotal;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="fixed inset-0 z-100 bg-[#F8FAFC] flex flex-col w-full h-full overflow-y-auto font-sans"
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
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest break-all">Order Number: {order.id && String(order.id).includes('ORD-') ? order.id : `ORD-20260329-${String(order.id).slice(-4)}`}</span>
                            {formattedDate && <span className="text-xs font-bold text-slate-500 mb-1">{formattedDate}</span>}
                            <span className="text-xl font-black text-slate-800">Status: <span className="text-emerald-600">{statusText}</span></span>
                            {paymentBadge}
                        </div>

                        {/* Items List */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide ml-1 flex items-center gap-2">
                                <Package className="w-4 h-4 text-[#007AFF]" /> Mahsulotlar
                            </h3>
                            <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-sm space-y-2">
                                {order.items?.map((item: any, idx: number) => {
                                    const prodName = item.product?.name || item.product?.nameUz || item.name || "Ortodontik mahsulot";
                                    const sku = item.product?.sku || item.sku || "OM-002";
                                    const imgUrl = item.product?.images?.[0]?.url || item.product?.image || item.image || item.primaryImageUrl || null;
                                    console.log("HISTORY_ITEM_RAW:", item.unitPrice, "FULL:", getFullItemPrice(item), "FULL_BASE:", getFullBasePrice(item));
                                    const qty = item.quantity || 1;
                                    const unitPrice = getFullItemPrice(item);
                                    const basePrice = getFullBasePrice(item);
                                    const itemTotal = qty * unitPrice;

                                    const hasDiscount = basePrice > unitPrice;
                                    const itemBasePrice = basePrice;

                                    // Extract variant name from item or parse note
                                    let variantName = item.productType?.name || item.type?.name || "";
                                    if (!variantName && order?.note) {
                                        const regex = new RegExp(`\\[Product: ${prodName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')} \\| Variant: ([^\\]]+)\\]`, 'i');
                                        const match = order.note.match(regex);
                                        if (match && match[1]) {
                                            variantName = match[1];
                                        }
                                    }

                                    return (
                                        <div key={idx} className="flex gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                                            {imgUrl ? (
                                                <div className="w-16 h-16 shrink-0 bg-white rounded-xl flex items-center justify-center p-1.5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                                    <img src={imgUrl} alt={prodName} className="w-full h-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 shrink-0 bg-slate-200/50 rounded-xl flex items-center justify-center border border-slate-100">
                                                    <Package className="w-6 h-6 text-slate-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 flex flex-col justify-center">
                                                <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{prodName}</p>
                                                {variantName && (
                                                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Variant: {variantName}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">SKU: {sku}</p>
                                                    <div className="w-1 rounded-full h-1 bg-slate-300"></div>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 tracking-wide">
                                                        <span>{qty} x</span>
                                                        {hasDiscount ? (
                                                            <>
                                                                <span className="line-through text-slate-400 font-medium">{formatPrice(itemBasePrice)}</span>
                                                                <span className="text-[#007AFF]">{formatPrice(unitPrice)}</span>
                                                            </>
                                                        ) : (
                                                            <span>{formatPrice(unitPrice)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end justify-center shrink-0">
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
                                    <span className="font-medium text-slate-500">To'lov turi</span>
                                    <span className="font-bold text-slate-900">{order.paymentMethod === 1 ? "Onlayn-o'tkazma (Card)" : "Naqd (Qabul qilinganda)"}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-500">Oraliq summa</span>
                                    <span className="font-bold text-slate-900">{formatPrice(subTotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-500">Yetkazib berish</span>
                                    <span className="font-bold text-slate-900">{isDelivery ? "Bepul" : "0 so'm"}</span>
                                </div>
                                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-xs font-black uppercase text-slate-400">Jami to'lov</span>
                                    <span className="text-xl font-black text-[#007AFF]">{formatPrice(finalTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
