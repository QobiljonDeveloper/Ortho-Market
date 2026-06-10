import React, { useState, useEffect } from "react";
import { Truck, MapPin, Store, ChevronDown, Building2 } from "lucide-react";
import { api } from "../services/api";

// API URL Fallback
const BASE_URL = (() => {
    try {
        const globalProcess = typeof globalThis !== "undefined" ? (globalThis as any).process : undefined;
        if (globalProcess?.env?.NEXT_PUBLIC_API_URL) {
            return globalProcess.env.NEXT_PUBLIC_API_URL;
        }
    } catch (e) {}
    try {
        if (import.meta.env && import.meta.env.VITE_API_URL) {
            return import.meta.env.VITE_API_URL;
        }
    } catch (e) {}
    return "https://ortadant-markert-api.kubesec.uz";
})();

export interface RegionApi {
    regionCode: string;
    nameUz: string;
}

export interface CityApi {
    cityCode: string;
    nameUz: string;
    regionCode: string;
}

export interface BranchApi {
    id: string | number;
    nameUz: string;
    addressUz: string;
    phone: string;
    cityCode: string;
    regionCode: string;
}

// Rich Mock Fallbacks
const MOCK_REGIONS: RegionApi[] = [
    { regionCode: "tashkent", nameUz: "Toshkent shahri" },
    { regionCode: "samarkand", nameUz: "Samarqand viloyati" },
    { regionCode: "fergana", nameUz: "Farg'ona viloyati" },
    { regionCode: "bukhara", nameUz: "Buxoro viloyati" }
];

const MOCK_CITIES: Record<string, CityApi[]> = {
    tashkent: [
        { cityCode: "tashkent-city", nameUz: "Toshkent shahri", regionCode: "tashkent" }
    ],
    samarkand: [
        { cityCode: "samarkand-city", nameUz: "Samarqand shahri", regionCode: "samarkand" },
        { cityCode: "gagarin-city", nameUz: "Gagarin shahri", regionCode: "samarkand" }
    ],
    fergana: [
        { cityCode: "fergana-city", nameUz: "Farg'ona shahri", regionCode: "fergana" },
        { cityCode: "kokand-city", nameUz: "Qo'qon shahri", regionCode: "fergana" },
        { cityCode: "margilan-city", nameUz: "Marg'ilon shahri", regionCode: "fergana" }
    ],
    bukhara: [
        { cityCode: "bukhara-city", nameUz: "Buxoro shahri", regionCode: "bukhara" },
        { cityCode: "gijduvan-city", nameUz: "G'ijduvon tumani", regionCode: "bukhara" }
    ]
};

const MOCK_BRANCHES: Record<string, BranchApi[]> = {
    "tashkent-city": [
        { id: "bts-tashkent-1", nameUz: "BTS Yunusobod filiali", addressUz: "Yunusobod tumani, 19-kvartal, 4-uy", phone: "+998 71 207-00-50", cityCode: "tashkent-city", regionCode: "tashkent" },
        { id: "bts-tashkent-2", nameUz: "BTS Chilonzor filiali", addressUz: "Chilonzor tumani, Qatortol ko'chasi, 24-uy", phone: "+998 71 207-00-51", cityCode: "tashkent-city", regionCode: "tashkent" },
        { id: "bts-tashkent-3", nameUz: "BTS Mirobod (Bosh ofis)", addressUz: "Mirobod tumani, Taras Shevchenko ko'chasi, 38-uy", phone: "+998 71 207-00-52", cityCode: "tashkent-city", regionCode: "tashkent" }
    ],
    "samarkand-city": [
        { id: "bts-sam-1", nameUz: "BTS Samarqand markaziy filiali", addressUz: "Samarqand shahri, Gagarin ko'chasi, 85-uy", phone: "+998 66 233-00-50", cityCode: "samarkand-city", regionCode: "samarkand" },
        { id: "bts-sam-2", nameUz: "BTS Registon filiali", addressUz: "Samarqand shahri, Registon ko'chasi, 12-uy", phone: "+998 66 233-00-51", cityCode: "samarkand-city", regionCode: "samarkand" }
    ],
    "gagarin-city": [
        { id: "bts-sam-3", nameUz: "BTS Gagarin filiali", addressUz: "Gagarin shahri, Sharof Rashidov ko'chasi, 15-uy", phone: "+998 66 233-00-52", cityCode: "gagarin-city", regionCode: "samarkand" }
    ],
    "fergana-city": [
        { id: "bts-fer-1", nameUz: "BTS Farg'ona shahar filiali", addressUz: "Farg'ona shahri, Al-Farg'oniy ko'chasi, 45-uy", phone: "+998 73 244-00-50", cityCode: "fergana-city", regionCode: "fergana" }
    ],
    "kokand-city": [
        { id: "bts-fer-2", nameUz: "BTS Qo'qon filiali", addressUz: "Qo'qon shahri, Turon ko'chasi, 110-uy", phone: "+998 73 542-00-51", cityCode: "kokand-city", regionCode: "fergana" }
    ],
    "margilan-city": [
        { id: "bts-fer-3", nameUz: "BTS Marg'ilon filiali", addressUz: "Marg'ilon shahri, Mustaqillik ko'chasi, 5-uy", phone: "+998 73 237-00-52", cityCode: "margilan-city", regionCode: "fergana" }
    ],
    "bukhara-city": [
        { id: "bts-bux-1", nameUz: "BTS Buxoro markaziy filiali", addressUz: "Buxoro shahri, Navoiy shoh ko'chasi, 18-uy", phone: "+998 65 221-00-50", cityCode: "bukhara-city", regionCode: "bukhara" }
    ],
    "gijduvan-city": [
        { id: "bts-bux-2", nameUz: "BTS G'ijduvon filiali", addressUz: "G'ijduvon tumani, Yusuf Hamadoniy ko'chasi, 3-uy", phone: "+998 65 572-00-51", cityCode: "gijduvan-city", regionCode: "bukhara" }
    ]
};

// Delivery options definition
export type DeliveryType = "delivery" | "pickup" | "bts";

interface BtsDeliverySelectorProps {
    onChange?: (data: {
        method: DeliveryType;
        regionId: string | null;
        branchId: string | null;
        regionName?: string | null;
        branchName?: string | null;
        branchAddress?: string | null;
        branchPhone?: string | null;
    }) => void;
}

export function BtsDeliverySelector({ onChange }: BtsDeliverySelectorProps) {
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryType>("delivery");

    // Data states
    const [regions, setRegions] = useState<RegionApi[]>([]);
    const [cities, setCities] = useState<CityApi[]>([]);
    const [branches, setBranches] = useState<BranchApi[]>([]);

    // Selection states
    const [selectedRegionCode, setSelectedRegionCode] = useState<string>("");
    const [selectedCityCode, setSelectedCityCode] = useState<string>("");
    const [selectedBranchId, setSelectedBranchId] = useState<string>("");

    // Loading states
    const [loadingRegions, setLoadingRegions] = useState<boolean>(false);
    const [loadingCities, setLoadingCities] = useState<boolean>(false);
    const [loadingBranches, setLoadingBranches] = useState<boolean>(false);

    const activeRegion = regions.find((r) => r.regionCode === selectedRegionCode);
    const activeBranch = branches.find((b) => String(b.id) === selectedBranchId);

    // Propagate choices to parent Checkout Component
    useEffect(() => {
        if (onChange) {
            onChange({
                method: deliveryMethod,
                regionId: deliveryMethod === "bts" ? (selectedRegionCode || null) : null,
                branchId: deliveryMethod === "bts" ? (selectedBranchId || null) : null,
                regionName: deliveryMethod === "bts" && activeRegion ? activeRegion.nameUz : null,
                branchName: deliveryMethod === "bts" && activeBranch ? activeBranch.nameUz : null,
                branchAddress: deliveryMethod === "bts" && activeBranch ? activeBranch.addressUz : null,
                branchPhone: deliveryMethod === "bts" && activeBranch ? activeBranch.phone : null,
            });
        }
    }, [deliveryMethod, selectedRegionCode, selectedBranchId, activeRegion, activeBranch, onChange]);

    // Step 1: Fetch regions list on selecting BTS Pochta
    useEffect(() => {
        if (deliveryMethod === "bts" && regions.length === 0) {
            const loadRegions = async () => {
                setLoadingRegions(true);
                try {
                    const res = await api.get(`${BASE_URL}/api/bts/regions`);
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        setRegions(res.data);
                    } else {
                        throw new Error("Empty regions data");
                    }
                } catch (err) {
                    console.warn("Regions API failed, falling back to mock:", err);
                    setRegions(MOCK_REGIONS);
                } finally {
                    setLoadingRegions(false);
                }
            };
            loadRegions();
        }
    }, [deliveryMethod, regions.length]);

    // Step 2: Fetch cities list on selecting a region
    useEffect(() => {
        if (selectedRegionCode) {
            const loadCities = async () => {
                setLoadingCities(true);
                setCities([]);
                try {
                    const res = await api.get(`${BASE_URL}/api/bts/cities`, {
                        params: { regionCode: selectedRegionCode }
                    });
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        setCities(res.data);
                    } else {
                        throw new Error("Empty cities data");
                    }
                } catch (err) {
                    console.warn("Cities API failed, falling back to mock:", err);
                    setCities(MOCK_CITIES[selectedRegionCode] || []);
                } finally {
                    setLoadingCities(false);
                }
            };
            loadCities();
        } else {
            setCities([]);
        }
    }, [selectedRegionCode]);

    // Step 3: Fetch branches list on selecting a city
    useEffect(() => {
        if (selectedRegionCode && selectedCityCode) {
            const loadBranches = async () => {
                setLoadingBranches(true);
                setBranches([]);
                try {
                    const res = await api.get(`${BASE_URL}/api/bts/branches`, {
                        params: { regionCode: selectedRegionCode, cityCode: selectedCityCode }
                    });
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        setBranches(res.data);
                    } else {
                        throw new Error("Empty branches data");
                    }
                } catch (err) {
                    console.warn("Branches API failed, falling back to mock:", err);
                    setBranches(MOCK_BRANCHES[selectedCityCode] || []);
                } finally {
                    setLoadingBranches(false);
                }
            };
            loadBranches();
        } else {
            setBranches([]);
        }
    }, [selectedRegionCode, selectedCityCode]);

    const handleMethodChange = (method: DeliveryType) => {
        setDeliveryMethod(method);
        if (method !== "bts") {
            setSelectedRegionCode("");
            setSelectedCityCode("");
            setSelectedBranchId("");
        }
    };

    const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedRegionCode(e.target.value);
        setSelectedCityCode("");
        setSelectedBranchId("");
    };

    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCityCode(e.target.value);
        setSelectedBranchId("");
    };

    const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedBranchId(e.target.value);
    };

    return (
        <div className="space-y-6 w-full max-w-md mx-auto bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.03)] text-slate-800 animate-in fade-in slide-in-from-top-1 duration-200">
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

                    {/* BTS Pochta Option */}
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

            {/* Dynamic Step 2: Region, City, Branch Selector (Appears only if BTS is chosen) */}
            {deliveryMethod === "bts" && (
                <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    
                    {/* 1. Viloyat (Region) Dropdown */}
                    <div className="space-y-1.5">
                        <label htmlFor="region-select" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Viloyatni tanlang
                        </label>
                        <div className="relative">
                            <select
                                id="region-select"
                                value={selectedRegionCode}
                                onChange={handleRegionChange}
                                disabled={loadingRegions}
                                className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 bg-[#F8FAFC] text-slate-800 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingRegions ? (
                                    <option value="" disabled>Yuklanmoqda...</option>
                                ) : (
                                    <>
                                        <option value="" disabled className="text-slate-400 font-medium">Viloyatni tanlang...</option>
                                        {regions.map((region) => (
                                            <option key={region.regionCode} value={region.regionCode} className="text-slate-800 font-semibold">
                                                {region.nameUz}
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                            <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                                <ChevronDown className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* 2. Shahar (City) Dropdown */}
                    <div className="space-y-1.5">
                        <label htmlFor="city-select" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Shaharni tanlang
                        </label>
                        <div className="relative">
                            <select
                                id="city-select"
                                value={selectedCityCode}
                                onChange={handleCityChange}
                                disabled={!selectedRegionCode || loadingCities}
                                className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 bg-[#F8FAFC] text-slate-800 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingCities ? (
                                    <option value="" disabled>Yuklanmoqda...</option>
                                ) : !selectedRegionCode ? (
                                    <option value="" disabled>Avval viloyatni tanlang</option>
                                ) : (
                                    <>
                                        <option value="" disabled className="text-slate-400 font-medium">Shaharni tanlang...</option>
                                        {cities.map((city) => (
                                            <option key={city.cityCode} value={city.cityCode} className="text-slate-800 font-semibold">
                                                {city.nameUz}
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                            <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                                <ChevronDown className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* 3. Filial (Branch) Dropdown */}
                    <div className="space-y-1.5">
                        <label htmlFor="branch-select" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            BTS Filialini tanlang
                        </label>
                        <div className="relative">
                            <select
                                id="branch-select"
                                value={selectedBranchId}
                                onChange={handleBranchChange}
                                disabled={!selectedCityCode || loadingBranches}
                                className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 bg-[#F8FAFC] text-slate-800 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingBranches ? (
                                    <option value="" disabled>Yuklanmoqda...</option>
                                ) : !selectedCityCode ? (
                                    <option value="" disabled>Avval shaharni tanlang</option>
                                ) : (
                                    <>
                                        <option value="" disabled className="text-slate-400 font-medium">Filialni tanlang...</option>
                                        {branches.map((branch) => (
                                            <option key={String(branch.id)} value={String(branch.id)} className="text-slate-800 font-semibold">
                                                {branch.nameUz}
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                            <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                                <ChevronDown className="w-5 h-5" />
                            </div>
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
                                    📍 Manzil: {activeBranch.addressUz}
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
