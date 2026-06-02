import { useState, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { useAuthContext } from "../context/AuthContext";
import { Button } from "./ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "./ui/sheet";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Textarea } from "./ui/textarea";
import { CreditCard, Truck, User, Phone, MapPin, MessageSquare, ArrowLeft, Store, ShieldCheck, Package } from "lucide-react";
import { AddressPopup } from "./AddressPopup";
import { useAddress } from "../hooks/useAddress";
import { api } from "../services/api";
import { toast } from "sonner";
import { BtsDeliverySelector } from "./BtsDeliverySelector";

const BTS_REGIONS_MAP: Record<string, string> = {
    tashkent: "Toshkent shahri",
    samarkand: "Samarqand viloyati",
    fergana: "Farg'ona viloyati",
    bukhara: "Buxoro viloyati"
};

const BTS_BRANCHES_MAP: Record<string, { name: string; address: string; phone: string }> = {
    "bts-tashkent-1": { name: "BTS Yunusobod filiali", address: "Yunusobod tumani, 19-kvartal, 4-uy", phone: "+998 71 207-00-50" },
    "bts-tashkent-2": { name: "BTS Chilonzor filiali", address: "Chilonzor tumani, Qatortol ko'chasi, 24-uy", phone: "+998 71 207-00-51" },
    "bts-tashkent-3": { name: "BTS Mirobod (Bosh ofis)", address: "Mirobod tumani, Taras Shevchenko ko'chasi, 38-uy", phone: "+998 71 207-00-52" },
    "bts-sam-1": { name: "BTS Samarqand markaziy filiali", address: "Samarqand shahri, Gagarin ko'chasi, 85-uy", phone: "+998 66 233-00-50" },
    "bts-sam-2": { name: "BTS Registon filiali", address: "Samarqand shahri, Registon ko'chasi, 12-uy", phone: "+998 66 233-00-51" },
    "bts-fer-1": { name: "BTS Farg'ona shahar filiali", address: "Farg'ona shahri, Al-Farg'oniy ko'chasi, 45-uy", phone: "+998 73 244-00-50" },
    "bts-fer-2": { name: "BTS Qo'qon filiali", address: "Qo'qon shahri, Turon ko'chasi, 110-uy", phone: "+998 73 542-00-51" },
    "bts-fer-3": { name: "BTS Marg'ilon filiali", address: "Marg'ilon shahri, Mustaqillik ko'chasi, 5-uy", phone: "+998 73 237-00-52" },
    "bts-bux-1": { name: "BTS Buxoro markaziy filiali", address: "Buxoro shahri, Navoiy shoh ko'chasi, 18-uy", phone: "+998 65 221-00-50" },
    "bts-bux-2": { name: "BTS G'ijduvon filiali", address: "G'ijduvon tumani, Yusuf Hamadoniy ko'chasi, 3-uy", phone: "+998 65 572-00-51" }
};

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

interface CheckoutDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRequireVariant?: (productId: string) => void;
}

export function CheckoutDrawer({ open, onOpenChange, onRequireVariant }: CheckoutDrawerProps) {
    const { clearCart, cart, productTypesMap, productsMap } = useCart();

    // Refresh trigger requested by user for reactivity
    const [refreshCartTrigger, setRefreshCartTrigger] = useState(0);

    useEffect(() => {
        const handleVariantSaved = () => setRefreshCartTrigger(prev => prev + 1);
        window.addEventListener('variantSaved', handleVariantSaved);
        return () => window.removeEventListener('variantSaved', handleVariantSaved);
    }, []);
    const { user, token } = useAuthContext();
    const { addresses, isLoadingAddresses } = useAddress(user?.id);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState("online");
    const [deliveryMethod, setDeliveryMethod] = useState("delivery");
    const [btsRegionId, setBtsRegionId] = useState<string | null>(null);
    const [btsBranchId, setBtsBranchId] = useState<string | null>(null);

    // Address UI State
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [isAddressPopupOpen, setIsAddressPopupOpen] = useState(false);

    // Form Personal Data
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("+998");

    // Custom note from user
    const [customNote, setCustomNote] = useState("");

    const VARIANTS_STORAGE_KEY = 'tg_cart_variants';

    const cartItemsWithDynamicPrices = useMemo(() => {
        const _trigger = refreshCartTrigger; // register dependency
        const savedVariantsStr = localStorage.getItem(VARIANTS_STORAGE_KEY);
        const storedVariants = savedVariantsStr ? JSON.parse(savedVariantsStr) : {};

        return cart.map((item: any) => {
            const lookupKey = Object.keys(storedVariants).find(k => k.toLowerCase() === String(item.productId).toLowerCase());
            const variantData = lookupKey ? storedVariants[lookupKey] : undefined;
            
            let itemTotal = 0;
            let originalItemTotal = 0;

            if (variantData?.productTypeId === "multi" && Array.isArray(variantData.selections) && variantData.selections.length > 0) {
                // Precise sum of selected variants
                itemTotal = variantData.selections.reduce((sum: number, sel: any) => sum + ((sel.priceExtra || 0) * (sel.quantity || 0)), 0);
                originalItemTotal = itemTotal;
            } else {
                const variantBasePrice = variantData?.childBasePrice || variantData?.parentBasePrice;
                const variantDiscountPrice = variantData?.childDiscountPrice || variantData?.parentDiscountPrice;
                
                if (variantData?.productTypeId !== "multi" && variantBasePrice !== undefined && variantBasePrice !== null && variantBasePrice > 0) {
                    const finalBasePrice = variantBasePrice;
                    const finalUnitPrice = (variantDiscountPrice !== undefined && variantDiscountPrice !== null && variantDiscountPrice < variantBasePrice)
                        ? variantDiscountPrice 
                        : variantBasePrice;
                    const extraPrice = (variantData?.parentPrice || 0) + (variantData?.childPrice || 0);
                    itemTotal = (finalUnitPrice + extraPrice) * (item.quantity || 0);
                    originalItemTotal = (finalBasePrice + extraPrice) * (item.quantity || 0);
                } else {
                    const product = productsMap[String(item.productId)];
                    let basePrice = item.basePrice || item.unitPrice || 0;
                    let unitPrice = item.unitPrice || item.basePrice || 0;

                    if (product) {
                        basePrice = product.basePrice || basePrice;
                        unitPrice = (product.discountPrice !== undefined && product.discountPrice < product.basePrice)
                            ? product.discountPrice
                            : product.basePrice;
                    }

                    const extraPrice = (variantData?.parentPrice || 0) + (variantData?.childPrice || 0);
                    itemTotal = (unitPrice + extraPrice) * (item.quantity || 0);
                    originalItemTotal = (basePrice + extraPrice) * (item.quantity || 0);
                }
            }

            const displayPrice = itemTotal / (item.quantity || 1);
            const originalPrice = originalItemTotal / (item.quantity || 1);
            const hasDiscount = displayPrice < originalPrice;

            return {
                ...item,
                displayPrice,
                originalPrice,
                hasDiscount,
                variantData
            };
        });
    }, [cart, refreshCartTrigger, productsMap]);

    const dynamicCartTotal = useMemo(() => {
        return cartItemsWithDynamicPrices.reduce((total: number, item: any) => total + (item.displayPrice * item.quantity), 0);
    }, [cartItemsWithDynamicPrices]);

    useEffect(() => {
        if (open) {
            setFullName(user?.fullName || "");
            setPhone(user?.phone || "+998");
            setCustomNote("");
        }
    }, [open, user]);

    // Automatically select the default or first address whenever addresses load
    useEffect(() => {
        if (addresses.length > 0 && !selectedAddressId) {
            const defaultAddress = addresses.find((a: any) => a.isDefault) || addresses[0];
            setSelectedAddressId(defaultAddress.id);
        }
    }, [addresses, selectedAddressId]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^\d+]/g, '');
        if (!val.startsWith('+998')) {
            val = '+998';
        }
        if (val.length > 13) {
            val = val.slice(0, 13);
        }
        setPhone(val);
    };

    const handleDeliveryChange = (value: string) => {
        setDeliveryMethod(value);
        if (value === "delivery" && addresses.length === 0) {
            setIsAddressPopupOpen(true);
        }
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString() + " so'm";
    };

    /**
     * Build a dynamic note string from variant selections directly from localStorage.
     * Format: "[Product: {cartItem.name} | Variant: {parentName} -> {childName}]"
     */
    const buildVariantNote = (): string | null => {
        try {
            const saved = localStorage.getItem(VARIANTS_STORAGE_KEY);
            if (!saved) return null;
            const savedMap = JSON.parse(saved);

            const variantNotes = cart
                .filter((item) => savedMap[item.productId])
                .map((item) => {
                    const v = savedMap[item.productId];
                    if (v.productTypeId === "multi" && Array.isArray(v.selections)) {
                        const selectionsStr = v.selections
                            .map((s: any) => `${s.name} (${s.quantity}x)`)
                            .join(", ");
                        return `[Product: ${item.productNameUz} | Variants: ${selectionsStr}]`;
                    }
                    const childPart = v.childName ? `-> ${v.childName}` : '';
                    return `[Product: ${item.productNameUz} | Variant: ${v.parentName} ${childPart}]`.trim().replace(' ]', ']');
                });

            return variantNotes.length > 0 ? variantNotes.join('\n') : null;
        } catch {
            return null;
        }
    };

    const handleConfirm = async () => {
        if (!user?.id || !token) {
            toast.error("Iltimos, avval tizimga kiring.");
            return;
        }
        if (deliveryMethod === "delivery" && !selectedAddressId) {
            toast.error("Iltimos, yetkazib berish manzilini tanlang.");
            return;
        }
        if (deliveryMethod === "bts") {
            if (!btsRegionId) {
                toast.error("Iltimos, BTS yetkazib berish viloyatini tanlang.");
                return;
            }
            if (!btsBranchId) {
                toast.error("Iltimos, BTS filialini tanlang.");
                return;
            }
        }
        if (!cart || cart.length === 0) {
            toast.error("Savatingiz bo'sh.");
            return;
        }

        const savedVariantsStr = localStorage.getItem(VARIANTS_STORAGE_KEY);
        const storedVariants = savedVariantsStr ? JSON.parse(savedVariantsStr) : {};

        const invalidItem = cart.find((item: any) => {
            const types = productTypesMap[item.productId];
            const requiresVariant = types && types.length > 0;
            const hasSelectedVariant = storedVariants[String(item.productId)];
            return requiresVariant && !hasSelectedVariant;
        });

        if (invalidItem) {
            toast.error('Iltimos, mahsulot turini tanlang: ' + invalidItem.productNameUz);
            if (onRequireVariant) onRequireVariant(invalidItem.productId);
            return;
        }

        setIsSubmitting(true);
        try {
            // Build the final note combining user's custom note + variant info + BTS details
            const variantNote = buildVariantNote();
            
            let btsNote = null;
            if (deliveryMethod === "bts" && btsRegionId && btsBranchId) {
                const regionName = BTS_REGIONS_MAP[btsRegionId] || btsRegionId;
                const branchObj = BTS_BRANCHES_MAP[btsBranchId];
                if (branchObj) {
                    btsNote = `--- BTS Yetkazib Berish ---\n📍 Viloyat: ${regionName}\n🏦 Filial: ${branchObj.name}\n🏠 Manzil: ${branchObj.address}\n📞 Aloqa: ${branchObj.phone}`;
                }
            }

            let finalNote = null;
            const noteParts = [];
            if (customNote.trim()) {
                noteParts.push(customNote.trim());
            }
            if (variantNote) {
                noteParts.push(`--- Selected Variants ---\n${variantNote}`);
            }
            if (btsNote) {
                noteParts.push(btsNote);
            }

            if (noteParts.length > 0) {
                finalNote = noteParts.join("\n\n");
            }

            const payload: any = {
                userId: user.id,
                telegramId: (user as any).telegramId || "",
                addressId: deliveryMethod === "delivery" ? selectedAddressId : null,
                paymentMethod: 1, // Card/Onlayn-o'tkazma
                deliveryMethod: deliveryMethod === "pickup" ? 0 : 1, // Map pickup to 0, both delivery & BTS to 1 (standard delivery payload indicator)
                subtotal: dynamicCartTotal,
                totalPrice: dynamicCartTotal,
                items: cartItemsWithDynamicPrices.flatMap((item: any) => {
                    const variant = storedVariants[String(item.productId)];
                    if (variant?.productTypeId === "multi" && Array.isArray(variant.selections)) {
                        return variant.selections.map((sel: any) => {
                            // Recover clean base product price without other selections' weighted extra
                            const product = productsMap[String(item.productId)];
                            const baseProductPrice = product
                                ? ((product.discountPrice !== undefined && product.discountPrice < product.basePrice) ? product.discountPrice : product.basePrice)
                                : (item.unitPrice || 0);
                            
                            const unitPrice = sel.priceExtra || 0;
                            return {
                                productId: item.productId,
                                productTypeId: Number(sel.productTypeId) || null,
                                quantity: sel.quantity,
                                unitPrice: unitPrice,
                                totalPrice: unitPrice * sel.quantity
                            };
                        });
                    }
                    return {
                        productId: item.productId,
                        productTypeId: variant?.productTypeId || null,
                        quantity: item.quantity,
                        unitPrice: item.displayPrice,  // variant + product narxi (14,500)
                        totalPrice: item.displayPrice * item.quantity
                    };
                })
            };

            console.log("DEBUG_ORDER_PAYLOAD:", JSON.stringify(payload, null, 2));

            // Include note only if there is content
            if (finalNote) {
                payload.note = finalNote;
            }

            const res = await api.post("/api/orders", payload, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            // 4. Cleanup: ONLY AFTER a successful 200/201 API response for order creation
            localStorage.removeItem(VARIANTS_STORAGE_KEY);

            try {
                await api.delete(`/api/cart/${user.id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
            } catch (err) {
                console.error("Failed to clear server cart:", err);
            }

            toast.success("Savat yangilandi", { duration: 2000, position: 'top-right' });
            clearCart();
            onOpenChange(false);

            window.dispatchEvent(new CustomEvent('open-order-details', { detail: res?.data || payload }));
        } catch (error: any) {
            console.error("Order submission failed:", error);
            const errMsgs = error?.response?.data?.message || "Buyurtmani rasmiylashtirishda xatolik yuz berdi.";
            toast.error(typeof errMsgs === 'string' ? errMsgs : errMsgs[0] || "Xatolik yuz berdi");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-md flex flex-col h-full bg-white border-l border-slate-200 p-0 text-slate-900 shadow-[-10px_0_40px_rgba(0,0,0,0.05)]"
            >
                <SheetHeader className="px-5 py-5 border-b border-slate-100 flex flex-row items-center gap-3 space-y-0 bg-white/80 backdrop-blur-xl shrink-0 sticky top-0 z-10 transition-all">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm"
                        onClick={() => onOpenChange(false)}
                    >
                        <ArrowLeft className="w-5 h-5" strokeWidth={2} />
                    </Button>
                    <SheetTitle className="text-xl font-bold text-slate-900 tracking-tight">
                        Rasmiylashtirish
                    </SheetTitle>
                    <SheetDescription className="sr-only">Buyurtmani rasmiylashtirish sahifasi</SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 px-5 py-6">
                    <div className="space-y-8">
                        {/* Cart Items Summary */}
                        {cart && cart.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-2 ml-1">
                                    <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#007AFF] border border-[#007AFF]/10">
                                        <Package className="w-4 h-4" strokeWidth={2} />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Mahsulotlar</h3>
                                </div>
                                <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                                    {cartItemsWithDynamicPrices.map((item: any) => {
                                        return (
                                            <div key={item.id} className="flex items-center gap-3 p-3.5">
                                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 p-1">
                                                    {item.primaryImageUrl ? (
                                                        <img src={item.primaryImageUrl} alt={item.productNameUz} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <div className="text-[8px] text-slate-300 font-bold text-center">📦</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-1">
                                                        {item.productNameUz}
                                                    </p>
                                                    {item.variantData && item.variantData.parentName && (
                                                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                                            Variant: {item.variantData.parentName}
                                                            {item.variantData.childName ? ` ➔ ${item.variantData.childName}` : ''}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                        <span className="text-[11px] text-slate-400">
                                                            {item.quantity} ×
                                                        </span>
                                                        {item.hasDiscount ? (
                                                            <>
                                                                <span className="text-[10px] text-slate-400 line-through font-medium">
                                                                    {formatPrice(item.originalPrice)}
                                                                </span>
                                                                <span className="text-[11px] font-bold text-[#007AFF]">
                                                                    {formatPrice(item.displayPrice)}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-600 font-semibold">
                                                                {formatPrice(item.displayPrice)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-slate-900 shrink-0">
                                                    {formatPrice(item.displayPrice * item.quantity)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Summary Section */}
                        <div className="bg-[#F8FAFC] p-6 rounded-3xl border border-slate-200 flex flex-col items-center group shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#007AFF]/5 rounded-full blur-[30px] pointer-events-none" />
                            <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">To'lov miqdori</span>
                            <span className="text-slate-900 font-black text-3xl tracking-tight">
                                {formatPrice(dynamicCartTotal)}
                            </span>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2 ml-1">
                                <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#007AFF] border border-[#007AFF]/10">
                                    <CreditCard className="w-4 h-4" strokeWidth={2} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">To'lov usuli</h3>
                            </div>
                            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid gap-3">
                                <div>
                                    <RadioGroupItem value="online" id="online" className="peer sr-only" />
                                    <Label
                                        htmlFor="online"
                                        className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 peer-data-[state=checked]:border-[#007AFF] peer-data-[state=checked]:bg-[#007AFF]/5 transition-all cursor-pointer shadow-sm group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-data-[state=checked]:text-[#007AFF] group-data-[state=checked]:bg-[#007AFF]/10 transition-colors border border-slate-100 group-data-[state=checked]:border-[#007AFF]/20">
                                                <CreditCard className="w-5 h-5" strokeWidth={2} />
                                            </div>
                                            <span className="font-bold text-slate-600 group-data-[state=checked]:text-slate-900">Onlayn-o'tkazma</span>
                                        </div>
                                        <div className="w-6 h-6 rounded-full border-2 border-slate-200 peer-data-[state=checked]:border-[#007AFF] transition-all flex items-center justify-center bg-white">
                                            <div className="w-3 h-3 rounded-full bg-[#007AFF] scale-0 peer-data-[state=checked]:scale-100 transition-transform" />
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Delivery Method Selector (Standard, Pickup, BTS Dependent Selector) */}
                        <BtsDeliverySelector 
                            onChange={(data) => {
                                setDeliveryMethod(data.method);
                                setBtsRegionId(data.regionId);
                                setBtsBranchId(data.branchId);
                                if (data.method === "delivery" && addresses.length === 0) {
                                    setIsAddressPopupOpen(true);
                                }
                            }}
                        />

                        {/* Personal Info */}
                        <div className="space-y-6 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ism-sharif</Label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <User className="w-4 h-4" strokeWidth={2} />
                                    </div>
                                    <Input
                                        id="name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="To'liq ismingizni kiriting"
                                        className="h-12 rounded-xl border-slate-200 bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#007AFF]/20 focus-visible:border-[#007AFF] text-slate-900 font-bold placeholder:text-slate-400 shadow-sm pl-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Telefon raqam</Label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Phone className="w-4 h-4" strokeWidth={2} />
                                    </div>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder="+998"
                                        className="h-12 rounded-xl border-slate-200 bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#007AFF]/20 focus-visible:border-[#007AFF] text-slate-900 font-bold placeholder:text-slate-400 shadow-sm pl-11 tracking-wide"
                                    />
                                </div>
                            </div>

                            {deliveryMethod === "delivery" && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Yetkazib berish manzili</Label>

                                    {isLoadingAddresses ? (
                                        <div className="h-16 w-full rounded-xl bg-slate-50 border border-slate-100 animate-pulse"></div>
                                    ) : addresses.length > 0 ? (
                                        <div className="space-y-3">
                                            {addresses.map((address: any) => {
                                                const isSelected = selectedAddressId === address.id;
                                                const regionName = REGION_MAP[address.region as number] || address.region;

                                                return (
                                                    <div
                                                        key={address.id}
                                                        onClick={() => setSelectedAddressId(address.id)}
                                                        className={`relative p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 shadow-sm group ${isSelected
                                                            ? "border-[#007AFF] bg-[#007AFF]/5"
                                                            : "border-slate-200 bg-white hover:border-[#007AFF]/50 hover:bg-slate-50"
                                                            }`}
                                                    >
                                                        <div className={`mt-0.5 ${isSelected ? 'text-[#007AFF]' : 'text-slate-400 group-hover:text-[#007AFF]/70'}`}>
                                                            <MapPin className="w-5 h-5" strokeWidth={2.5} />
                                                        </div>
                                                        <div className="flex-1 flex flex-col pr-2">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-bold text-slate-900 leading-tight">
                                                                    {address.label || "Uy"}
                                                                </span>
                                                                {address.isDefault && (
                                                                    <span className="px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-[10px] font-bold uppercase tracking-wide">
                                                                        Asosiy
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-medium text-slate-500 leading-relaxed">
                                                                {regionName}, {address.city}, {address.street}
                                                            </span>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#007AFF] bg-white' : 'border-slate-200 bg-transparent'
                                                            }`}>
                                                            <div className={`w-2 h-2 rounded-full bg-[#007AFF] transition-all ${isSelected ? 'scale-100' : 'scale-0'
                                                                }`} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <button
                                                onClick={() => setIsAddressPopupOpen(true)}
                                                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-[#007AFF]/30 bg-[#007AFF]/5 text-[#007AFF] hover:bg-[#007AFF]/10 hover:border-[#007AFF]/50 transition-all font-bold text-xs"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                                Yangi manzil qo'shish
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => setIsAddressPopupOpen(true)}
                                            className="relative h-12 rounded-xl border-2 border-dashed border-[#007AFF]/30 bg-[#007AFF]/5 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#007AFF]/10 hover:border-[#007AFF]/50 transition-all text-[#007AFF]"
                                        >
                                            <MapPin className="w-4 h-4" strokeWidth={2.5} />
                                            <span className="text-sm font-bold">Karta ustiga manzil qo'shing</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="comment" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Izoh (ixtiyoriy)</Label>
                                <div className="relative">
                                    <div className="absolute left-4 top-4 text-slate-400">
                                        <MessageSquare className="w-4 h-4" strokeWidth={2} />
                                    </div>
                                    <Textarea
                                        id="comment"
                                        value={customNote}
                                        onChange={(e) => setCustomNote(e.target.value)}
                                        placeholder="Qo'shimcha istaklaringiz..."
                                        className="min-h-[100px] rounded-xl border-slate-200 bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#007AFF]/20 focus-visible:border-[#007AFF] text-slate-900 font-medium resize-none pl-11 py-4 placeholder:text-slate-400 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Trust Banner */}
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                                <ShieldCheck className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-emerald-800 tracking-tight">Xavfsiz buyurtma</span>
                                <span className="text-[10px] text-emerald-600 font-medium">Barcha ma'lumotlar himoyalangan</span>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-6 bg-white border-t border-slate-100 mt-auto shadow-[0_-10px_30px_rgba(0,0,0,0.03)] rounded-t-[2.5rem] relative">
                    <Button
                        disabled={isSubmitting}
                        className="w-full rounded-full h-14 text-base font-black bg-[#007AFF] hover:bg-[#005bb5] text-white shadow-[0_8px_20px_rgba(0,122,255,0.25)] hover:shadow-[0_10px_25px_rgba(0,122,255,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        onClick={handleConfirm}
                    >
                        {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Buyurtmani tasdiqlash"}
                    </Button>
                </div>
            </SheetContent>

            <AddressPopup
                open={isAddressPopupOpen}
                onOpenChange={setIsAddressPopupOpen}
                onSaveSuccess={(id: string | undefined) => {
                    if (id) setSelectedAddressId(id);
                }}
            />
        </Sheet>
    );
}
