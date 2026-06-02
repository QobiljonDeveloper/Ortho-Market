import React, { useState, useEffect } from "react";
import { Truck, MapPin, Store, ChevronDown, Check, Building2 } from "lucide-react";

// 1. Mock Data Structures in Uzbek
export interface BtsBranch {
    id: string;
    name: string;
    address: string;
    phone: string;
}

export interface Region {
    id: string;
    name: string;
    branches: BtsBranch[];
}

const REGIONS_DATA: Region[] = [
    {
        id: "tashkent",
        name: "Toshkent shahri",
        branches: [
            { id: "bts-tashkent-1", name: "BTS Yunusobod filiali", address: "Yunusobod tumani, 19-kvartal, 4-uy", phone: "+998 71 207-00-50" },
            { id: "bts-tashkent-2", name: "BTS Chilonzor filiali", address: "Chilonzor tumani, Qatortol ko'chasi, 24-uy", phone: "+998 71 207-00-51" },
            { id: "bts-tashkent-3", name: "BTS Mirobod (Bosh ofis)", address: "Mirobod tumani, Taras Shevchenko ko'chasi, 38-uy", phone: "+998 71 207-00-52" }
        ]
    },
    {
        id: "samarkand",
        name: "Samarqand viloyati",
        branches: [
            { id: "bts-sam-1", name: "BTS Samarqand markaziy filiali", address: "Samarqand shahri, Gagarin ko'chasi, 85-uy", phone: "+998 66 233-00-50" },
            { id: "bts-sam-2", name: "BTS Registon filiali", address: "Samarqand shahri, Registon ko'chasi, 12-uy", phone: "+998 66 233-00-51" }
        ]
    },
    {
        id: "fergana",
        name: "Farg'ona viloyati",
        branches: [
            { id: "bts-fer-1", name: "BTS Farg'ona shahar filiali", address: "Farg'ona shahri, Al-Farg'oniy ko'chasi, 45-uy", phone: "+998 73 244-00-50" },
            { id: "bts-fer-2", name: "BTS Qo'qon filiali", address: "Qo'qon shahri, Turon ko'chasi, 110-uy", phone: "+998 73 542-00-51" },
            { id: "bts-fer-3", name: "BTS Marg'ilon filiali", address: "Marg'ilon shahri, Mustaqillik ko'chasi, 5-uy", phone: "+998 73 237-00-52" }
        ]
    },
    {
        id: "bukhara",
        name: "Buxoro viloyati",
        branches: [
            { id: "bts-bux-1", name: "BTS Buxoro markaziy filiali", address: "Buxoro shahri, Navoiy shoh ko'chasi, 18-uy", phone: "+998 65 221-00-50" },
            { id: "bts-bux-2", name: "BTS G'ijduvon filiali", address: "G'ijduvon tumani, Yusuf Hamadoniy ko'chasi, 3-uy", phone: "+998 65 572-00-51" }
        ]
    }
];

// Delivery options definition
export type DeliveryType = "delivery" | "pickup" | "bts";

interface BtsDeliverySelectorProps {
    onChange?: (data: {
        method: DeliveryType;
        regionId: string | null;
        branchId: string | null;
    }) => void;
}

export function BtsDeliverySelector({ onChange }: BtsDeliverySelectorProps) {
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryType>("delivery");
    const [selectedRegionId, setSelectedRegionId] = useState<string>("");
    const [selectedBranchId, setSelectedBranchId] = useState<string>("");

    // Trigger parent callback when any selection changes
    useEffect(() => {
        if (onChange) {
            onChange({
                method: deliveryMethod,
                regionId: deliveryMethod === "bts" ? (selectedRegionId || null) : null,
                branchId: deliveryMethod === "bts" ? (selectedBranchId || null) : null,
            });
        }
    }, [deliveryMethod, selectedRegionId, selectedBranchId, onChange]);

    // Clear branch selection if region changes
    const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedRegionId(e.target.value);
        setSelectedBranchId(""); // Critical clearing logic
    };

    const handleMethodChange = (method: DeliveryType) => {
        setDeliveryMethod(method);
        if (method !== "bts") {
            setSelectedRegionId("");
            setSelectedBranchId("");
        }
    };

    // Find active branches for the selected region
    const activeRegion = REGIONS_DATA.find((r) => r.id === selectedRegionId);
    const availableBranches = activeRegion ? activeRegion.branches : [];
    const activeBranch = availableBranches.find((b) => b.id === selectedBranchId);

    return (
        <div className="space-y-6 w-full max-w-md mx-auto bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.03)] text-slate-800">
            {/* Header / Delivery Method Selector */}
            <div className="space-y-3">
                <div className="flex items-center gap-2.5 mb-1.5 ml-0.5">
                    <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#007AFF] border border-[#007AFF]/10">
                        <Truck className="w-4.5 h-4.5" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Yetkazib berish usuli</h3>
                </div>

                <div className="grid gap-3">
                    {/* Standard Delivery Option */}
                    <div 
                        onClick={() => handleMethodChange("delivery")}
                        className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer shadow-sm ${
                            deliveryMethod === "delivery"
                                ? "border-[#007AFF] bg-[#007AFF]/5"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                    >
                        <div className="flex items-center gap-3.5">
                            <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                                deliveryMethod === "delivery" 
                                    ? "text-[#007AFF] bg-[#007AFF]/10 border border-[#007AFF]/10" 
                                    : "text-slate-400 bg-slate-50 border border-slate-100 group-hover:text-slate-600"
                            }`}>
                                <Truck className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <div className="flex flex-col">
                                <span className={`font-bold text-sm transition-colors ${
                                    deliveryMethod === "delivery" ? "text-slate-900" : "text-slate-600"
                                }`}>Standard Kuryer</span>
                                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Manzilgacha yetkazish</span>
                            </div>
                        </div>
                        <div className={`w-5.5 h-5.5 rounded-full border-2 transition-all flex items-center justify-center bg-white ${
                            deliveryMethod === "delivery" ? "border-[#007AFF]" : "border-slate-200"
                        }`}>
                            <div className={`w-2.5 h-2.5 rounded-full bg-[#007AFF] transition-transform duration-300 ${
                                deliveryMethod === "delivery" ? "scale-100" : "scale-0"
                            }`} />
                        </div>
                    </div>

                    {/* Pickup Option */}
                    <div 
                        onClick={() => handleMethodChange("pickup")}
                        className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer shadow-sm ${
                            deliveryMethod === "pickup"
                                ? "border-[#007AFF] bg-[#007AFF]/5"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                    >
                        <div className="flex items-center gap-3.5">
                            <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                                deliveryMethod === "pickup" 
                                    ? "text-[#007AFF] bg-[#007AFF]/10 border border-[#007AFF]/10" 
                                    : "text-slate-400 bg-slate-50 border border-slate-100 group-hover:text-slate-600"
                            }`}>
                                <Store className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <div className="flex flex-col">
                                <span className={`font-bold text-sm transition-colors ${
                                    deliveryMethod === "pickup" ? "text-slate-900" : "text-slate-600"
                                }`}>Do'kondan olib ketish</span>
                                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Shaxsan tashrif buyuring</span>
                            </div>
                        </div>
                        <div className={`w-5.5 h-5.5 rounded-full border-2 transition-all flex items-center justify-center bg-white ${
                            deliveryMethod === "pickup" ? "border-[#007AFF]" : "border-slate-200"
                        }`}>
                            <div className={`w-2.5 h-2.5 rounded-full bg-[#007AFF] transition-transform duration-300 ${
                                deliveryMethod === "pickup" ? "scale-100" : "scale-0"
                            }`} />
                        </div>
                    </div>

                    {/* BTS Courier (Courier service with dependent logic) */}
                    <div 
                        onClick={() => handleMethodChange("bts")}
                        className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer shadow-sm ${
                            deliveryMethod === "bts"
                                ? "border-[#007AFF] bg-[#007AFF]/5"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                    >
                        <div className="flex items-center gap-3.5">
                            <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                                deliveryMethod === "bts" 
                                    ? "text-[#007AFF] bg-[#007AFF]/10 border border-[#007AFF]/10" 
                                    : "text-slate-400 bg-slate-50 border border-slate-100 group-hover:text-slate-600"
                            }`}>
                                <Building2 className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <div className="flex flex-col">
                                <span className={`font-bold text-sm transition-colors ${
                                    deliveryMethod === "bts" ? "text-slate-900" : "text-slate-600"
                                }`}>BTS Pochta</span>
                                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Filial orqali yetkazish</span>
                            </div>
                        </div>
                        <div className={`w-5.5 h-5.5 rounded-full border-2 transition-all flex items-center justify-center bg-white ${
                            deliveryMethod === "bts" ? "border-[#007AFF]" : "border-slate-200"
                        }`}>
                            <div className={`w-2.5 h-2.5 rounded-full bg-[#007AFF] transition-transform duration-300 ${
                                deliveryMethod === "bts" ? "scale-100" : "scale-0"
                            }`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Step 2: Region Selection (Appears only if BTS is chosen) */}
            {deliveryMethod === "bts" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label htmlFor="region-select" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Viloyatni tanlang
                    </label>
                    <div className="relative">
                        <select
                            id="region-select"
                            value={selectedRegionId}
                            onChange={handleRegionChange}
                            className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 bg-[#F8FAFC] text-slate-800 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all appearance-none"
                        >
                            <option value="" disabled className="text-slate-400 font-medium">Viloyatni tanlang...</option>
                            {REGIONS_DATA.map((region) => (
                                <option key={region.id} value={region.id} className="text-slate-800 font-semibold">
                                    {region.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                            <ChevronDown className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            )}

            {/* Dynamic Step 3: Branch Selection (Appears only if Region is selected and BTS is chosen) */}
            {deliveryMethod === "bts" && selectedRegionId && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label htmlFor="branch-select" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        BTS Filialini tanlang
                    </label>
                    <div className="relative">
                        <select
                            id="branch-select"
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 bg-[#F8FAFC] text-slate-800 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all appearance-none"
                        >
                            <option value="" disabled className="text-slate-400 font-medium">Filialni tanlang...</option>
                            {availableBranches.map((branch) => (
                                <option key={branch.id} value={branch.id} className="text-slate-800 font-semibold">
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                            <ChevronDown className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Premium Branch Info Display */}
                    {activeBranch && (
                        <div className="mt-3.5 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/60 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="mt-0.5 text-emerald-600 bg-white p-2 rounded-xl border border-emerald-100 shadow-sm shrink-0">
                                <MapPin className="w-4 h-4" strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black text-emerald-800 leading-tight mb-1">
                                    Tanlangan filial ma'lumotlari:
                                </span>
                                <span className="text-xs font-bold text-slate-700 leading-relaxed break-words">
                                    📍 Manzil: {activeBranch.address}
                                </span>
                                <span className="text-[11px] font-bold text-emerald-700 mt-1">
                                    📞 Aloqa: {activeBranch.phone}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
