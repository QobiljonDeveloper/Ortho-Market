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
    code: string;
    name: string;
}

export interface CityApi {
    code: string;
    name: string;
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

// Transliteration Map: Uzbek Cyrillic to Uzbek Latin
export function cyrillicToLatin(text: string): string {
    if (!text) return "";
    
    const map: Record<string, string> = {
        // Double-character mappings
        "Ё": "Yo", "ё": "yo",
        "Ц": "Ts", "ц": "ts",
        "Ч": "Ch", "ч": "ch",
        "Ш": "Sh", "ш": "sh",
        "Щ": "Sh", "щ": "sh",
        "Ю": "Yu", "ю": "yu",
        "Я": "Ya", "я": "ya",
        "Ў": "O'", "ў": "o'",
        "Ғ": "G'", "ғ": "g'",
        "Қ": "Q", "қ": "q",
        "Ҳ": "H", "ҳ": "h",
        
        // Single characters
        "А": "A", "а": "a",
        "Б": "B", "б": "b",
        "В": "V", "в": "v",
        "Г": "G", "г": "g",
        "Д": "D", "д": "d",
        "Е": "E", "е": "e",
        "Ж": "J", "ж": "j",
        "З": "Z", "з": "z",
        "И": "I", "и": "i",
        "Й": "Y", "й": "y",
        "К": "K", "к": "k",
        "Л": "L", "л": "l",
        "М": "M", "м": "m",
        "Н": "N", "н": "n",
        "О": "O", "о": "o",
        "П": "P", "п": "p",
        "Р": "R", "р": "r",
        "С": "S", "с": "s",
        "Т": "T", "т": "t",
        "У": "U", "у": "u",
        "Ф": "F", "ф": "f",
        "Х": "X", "х": "x",
        "Э": "E", "э": "e",
        "Ы": "I", "ы": "i",
        "Ъ": "'", "ъ": "'",
        "Ь": "",  "ь": ""
    };

    let result = "";
    const vowels = "АаЕеЁёИиОоУуЭэЮюЯяЎў";
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Handling the "Ye" / "ye" rule (at the beginning of words and after vowels)
        if (char === "Е" || char === "е") {
            const isStart = (i === 0);
            const isAfterVowel = !isStart && vowels.includes(text[i - 1]);
            if (isStart || isAfterVowel) {
                result += (char === "Е") ? "Ye" : "ye";
                continue;
            }
        }
        
        result += map[char] !== undefined ? map[char] : char;
    }
    
    return result;
}

// 14 regions of Uzbekistan translation map (covers Russian and Cyrillic)
const REGION_TRANSLATION_MAP: Record<string, string> = {
    // Toshkent
    "ташкент г.": "Toshkent shahri",
    "г. ташкент": "Toshkent shahri",
    "город ташкент": "Toshkent shahri",
    "ташкент": "Toshkent shahri",
    "тошкент": "Toshkent shahri",
    "tashkent": "Toshkent shahri",
    "tashkent city": "Toshkent shahri",
    "ташкентская область": "Toshkent viloyati",
    "ташкентская": "Toshkent viloyati",
    "tashkent region": "Toshkent viloyati",
    "tashkent viloyati": "Toshkent viloyati",
    
    // Samarqand
    "самаркандская область": "Samarqand viloyati",
    "самаркандская": "Samarqand viloyati",
    "самарканд": "Samarqand viloyati",
    "samarqand": "Samarqand viloyati",
    "samarkand": "Samarqand viloyati",
    "samarkand region": "Samarqand viloyati",
    "samarqand viloyati": "Samarqand viloyati",
    
    // Farg'ona
    "ферганская область": "Farg'ona viloyati",
    "ферганская": "Farg'ona viloyati",
    "фергана": "Farg'ona viloyati",
    "farg'ona": "Farg'ona viloyati",
    "fergana": "Farg'ona viloyati",
    "fergana region": "Farg'ona viloyati",
    "farg'ona viloyati": "Farg'ona viloyati",
    
    // Andijon
    "андижанская область": "Andijon viloyati",
    "андижанская": "Andijon viloyati",
    "андижан": "Andijon viloyati",
    "andijon": "Andijon viloyati",
    "andijan": "Andijon viloyati",
    "andijan region": "Andijon viloyati",
    "andijon viloyati": "Andijon viloyati",
    
    // Namangan
    "наманганская область": "Namangan viloyati",
    "наманганская": "Namangan viloyati",
    "наманган": "Namangan viloyati",
    "namangan": "Namangan viloyati",
    "namangan region": "Namangan viloyati",
    "namangan viloyati": "Namangan viloyati",
    
    // Buxoro
    "бухарская область": "Buxoro viloyati",
    "бухарская": "Buxoro viloyati",
    "бухара": "Buxoro viloyati",
    "buxoro": "Buxoro viloyati",
    "bukhara": "Buxoro viloyati",
    "bukhara region": "Buxoro viloyati",
    "buxoro viloyati": "Buxoro viloyati",
    
    // Xorazm
    "хорезмская область": "Xorazm viloyati",
    "хорезмская": "Xorazm viloyati",
    "хорезм": "Xorazm viloyati",
    "xorazm": "Xorazm viloyati",
    "khorezm": "Xorazm viloyati",
    "khorezm region": "Xorazm viloyati",
    "xorazm viloyati": "Xorazm viloyati",
    
    // Navoiy
    "навоийская область": "Navoiy viloyati",
    "навоийская": "Navoiy viloyati",
    "навои": "Navoiy viloyati",
    "navoiy": "Navoiy viloyati",
    "navoi": "Navoiy viloyati",
    "navoi region": "Navoiy viloyati",
    "navoiy viloyati": "Navoiy viloyati",
    
    // Qashqadaryo
    "кашкадарьинская область": "Qashqadaryo viloyati",
    "кашкадарьинская": "Qashqadaryo viloyati",
    "кашкадарья": "Qashqadaryo viloyati",
    "qashqadaryo": "Qashqadaryo viloyati",
    "kashkadarya": "Qashqadaryo viloyati",
    "kashkadarya region": "Qashqadaryo viloyati",
    "qashqadaryo viloyati": "Qashqadaryo viloyati",
    
    // Surxondaryo
    "сурхандарьинская область": "Surxondaryo viloyati",
    "сурхандарьинская": "Surxondaryo viloyati",
    "сурхандарья": "Surxondaryo viloyati",
    "surxondaryo": "Surxondaryo viloyati",
    "surkhandarya": "Surxondaryo viloyati",
    "surkhandarya region": "Surxondaryo viloyati",
    "surxondaryo viloyati": "Surxondaryo viloyati",
    
    // Jizzax
    "джизакская область": "Jizzax viloyati",
    "джизакская": "Jizzax viloyati",
    "джизак": "Jizzax viloyati",
    "jizzax": "Jizzax viloyati",
    "djizzakh": "Jizzax viloyati",
    "jizzakh": "Jizzax viloyati",
    "jizzakh region": "Jizzax viloyati",
    "jizzax viloyati": "Jizzax viloyati",
    
    // Sirdaryo
    "сырдарьинская область": "Sirdaryo viloyati",
    "сырдарьинская": "Sirdaryo viloyati",
    "сырдарья": "Sirdaryo viloyati",
    "sirdaryo": "Sirdaryo viloyati",
    "syrdarya": "Sirdaryo viloyati",
    "syrdarya region": "Sirdaryo viloyati",
    "sirdaryo viloyati": "Sirdaryo viloyati",
    
    // Qoraqalpog'iston
    "республика каракалпакстан": "Qoraqalpog'iston Respublikasi",
    "каракалпакстан": "Qoraqalpog'iston Respublikasi",
    "qoraqalpog'iston": "Qoraqalpog'iston Respublikasi",
    "karakalpakstan": "Qoraqalpog'iston Respublikasi",
    "karakalpakstan region": "Qoraqalpog'iston Respublikasi",
    "qoraqalpog'iston respublikasi": "Qoraqalpog'iston Respublikasi"
};

export const translateRegion = (name: string): string => {
    if (!name) return "";
    const trimmed = name.trim();
    const key = trimmed.toLowerCase();
    if (REGION_TRANSLATION_MAP[key]) {
        return REGION_TRANSLATION_MAP[key];
    }
    // Fallback: transliterate from Cyrillic to Latin
    return cyrillicToLatin(trimmed);
};

// Rich Mock Fallbacks using string codes with leading zeros (e.g. '01')
const MOCK_REGIONS: RegionApi[] = [
    { code: "01", name: "Toshkent shahri" },
    { code: "10", name: "Toshkent viloyati" },
    { code: "18", name: "Samarqand viloyati" },
    { code: "30", name: "Farg'ona viloyati" },
    { code: "06", name: "Buxoro viloyati" }
];

const MOCK_CITIES: Record<string, CityApi[]> = {
    "01": [
        { code: "tashkent-city", name: "Toshkent shahri", regionCode: "01" }
    ],
    "10": [
        { code: "angren-city", name: "Angren shahri", regionCode: "10" },
        { code: "chirchik-city", name: "Chirchiq shahri", regionCode: "10" }
    ],
    "18": [
        { code: "samarkand-city", name: "Samarqand shahri", regionCode: "18" },
        { code: "gagarin-city", name: "Gagarin shahri", regionCode: "18" }
    ],
    "30": [
        { code: "fergana-city", name: "Farg'ona shahri", regionCode: "30" },
        { code: "kokand-city", name: "Qo'qon shahri", regionCode: "30" },
        { code: "margilan-city", name: "Marg'ilon shahri", regionCode: "30" }
    ],
    "06": [
        { code: "bukhara-city", name: "Buxoro shahri", regionCode: "06" },
        { code: "gijduvan-city", name: "G'ijduvon tumani", regionCode: "06" }
    ]
};

const MOCK_BRANCHES: Record<string, BranchApi[]> = {
    "tashkent-city": [
        { id: "bts-tashkent-1", nameUz: "BTS Yunusobod filiali", addressUz: "Yunusobod tumani, 19-kvartal, 4-uy", phone: "+998 71 207-00-50", cityCode: "tashkent-city", regionCode: "01" },
        { id: "bts-tashkent-2", nameUz: "BTS Chilonzor filiali", addressUz: "Chilonzor tumani, Qatortol ko'chasi, 24-uy", phone: "+998 71 207-00-51", cityCode: "tashkent-city", regionCode: "01" },
        { id: "bts-tashkent-3", nameUz: "BTS Mirobod (Bosh ofis)", addressUz: "Mirobod tumani, Taras Shevchenko ko'chasi, 38-uy", phone: "+998 71 207-00-52", cityCode: "tashkent-city", regionCode: "01" }
    ],
    "angren-city": [
        { id: "bts-angren-1", nameUz: "BTS Angren filiali", addressUz: "Angren shahri, Mustaqillik ko'chasi, 12-uy", phone: "+998 71 207-00-60", cityCode: "angren-city", regionCode: "10" }
    ],
    "chirchik-city": [
        { id: "bts-chirchik-1", nameUz: "BTS Chirchiq filiali", addressUz: "Chirchiq shahri, Alisher Navoiy ko'chasi, 45-uy", phone: "+998 71 207-00-70", cityCode: "chirchik-city", regionCode: "10" }
    ],
    "samarkand-city": [
        { id: "bts-sam-1", nameUz: "BTS Samarqand markaziy filiali", addressUz: "Samarqand shahri, Gagarin ko'chasi, 85-uy", phone: "+998 66 233-00-50", cityCode: "samarkand-city", regionCode: "18" },
        { id: "bts-sam-2", nameUz: "BTS Registon filiali", addressUz: "Samarqand shahri, Registon ko'chasi, 12-uy", phone: "+998 66 233-00-51", cityCode: "samarkand-city", regionCode: "18" }
    ],
    "gagarin-city": [
        { id: "bts-sam-3", nameUz: "BTS Gagarin filiali", addressUz: "Gagarin shahri, Sharof Rashidov ko'chasi, 15-uy", phone: "+998 66 233-00-52", cityCode: "gagarin-city", regionCode: "18" }
    ],
    "fergana-city": [
        { id: "bts-fer-1", nameUz: "BTS Farg'ona shahar filiali", addressUz: "Farg'ona shahri, Al-Farg'oniy ko'chasi, 45-uy", phone: "+998 73 244-00-50", cityCode: "fergana-city", regionCode: "30" }
    ],
    "kokand-city": [
        { id: "bts-fer-2", nameUz: "BTS Qo'qon filiali", addressUz: "Qo'qon shahri, Turon ko'chasi, 110-uy", phone: "+998 73 542-00-51", cityCode: "kokand-city", regionCode: "30" }
    ],
    "margilan-city": [
        { id: "bts-fer-3", nameUz: "BTS Marg'ilon filiali", addressUz: "Marg'ilon shahri, Mustaqillik ko'chasi, 5-uy", phone: "+998 73 237-00-52", cityCode: "margilan-city", regionCode: "30" }
    ],
    "bukhara-city": [
        { id: "bts-bux-1", nameUz: "BTS Buxoro markaziy filiali", addressUz: "Buxoro shahri, Navoiy shoh ko'chasi, 18-uy", phone: "+998 65 221-00-50", cityCode: "bukhara-city", regionCode: "06" }
    ],
    "gijduvan-city": [
        { id: "bts-bux-2", nameUz: "BTS G'ijduvon filiali", addressUz: "G'ijduvon tumani, Yusuf Hamadoniy ko'chasi, 3-uy", phone: "+998 65 572-00-51", cityCode: "gijduvan-city", regionCode: "06" }
    ]
};

// Delivery options definition
export type DeliveryType = "delivery" | "pickup" | "bts";

interface BtsDeliverySelectorProps {
    token?: string | null;
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

export function BtsDeliverySelector({ token: propToken, onChange }: BtsDeliverySelectorProps) {
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryType>("delivery");
    const token = propToken || (typeof window !== "undefined" ? localStorage.getItem("token") : null);

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

    const activeRegion = regions.find((r) => r.code === selectedRegionCode);
    const activeCity = cities.find((c) => c.code === selectedCityCode);
    const activeBranch = branches.find((b) => String(b.id) === selectedBranchId);

    // Propagate choices to parent Checkout Component
    useEffect(() => {
        if (onChange) {
            onChange({
                method: deliveryMethod,
                regionId: deliveryMethod === "bts" ? (selectedRegionCode || null) : null,
                branchId: deliveryMethod === "bts" ? (selectedBranchId || null) : null,
                regionName: deliveryMethod === "bts" && activeRegion ? activeRegion.name : null,
                branchName: deliveryMethod === "bts" && activeBranch ? activeBranch.nameUz : null,
                branchAddress: deliveryMethod === "bts" && activeBranch ? activeBranch.addressUz : null,
                branchPhone: deliveryMethod === "bts" && activeBranch ? activeBranch.phone : null,
            });
        }
    }, [deliveryMethod, selectedRegionCode, selectedBranchId, activeRegion, activeBranch, onChange]);

    // Helpers to build authorization headers dynamically
    const getHeaders = () => {
        return {
            Authorization: token ? `Bearer ${token}` : undefined
        };
    };

    // Step 1: Fetch regions list on mount (immediately)
    useEffect(() => {
        const loadRegions = async () => {
            setLoadingRegions(true);
            try {
                const res = await api.get(`${BASE_URL}/api/bts/regions`, {
                    headers: getHeaders()
                });
                if (Array.isArray(res.data) && res.data.length > 0) {
                    const mapped = res.data.map((r: any) => {
                        const code = String(r.code !== undefined && r.code !== null ? r.code : (r.regionCode !== undefined && r.regionCode !== null ? r.regionCode : "")).trim();
                        const rawName = String(r.name || r.nameUz || "").trim();
                        return {
                            code,
                            name: translateRegion(rawName)
                        };
                    }).filter((r: any) => r.code);
                    setRegions(mapped);
                } else {
                    throw new Error("Empty regions data");
                }
            } catch (err) {
                console.warn("Regions API failed, falling back to mock:", err);
                const mappedMock = MOCK_REGIONS.map((r) => ({
                    code: r.code,
                    name: translateRegion(r.name)
                }));
                setRegions(mappedMock);
            } finally {
                setLoadingRegions(false);
            }
        };
        loadRegions();
    }, [token]);

    // Step 2: Fetch cities list on selecting a region
    useEffect(() => {
        if (selectedRegionCode) {
            const loadCities = async () => {
                setLoadingCities(true);
                setCities([]);
                try {
                    const res = await api.get(`${BASE_URL}/api/bts/cities`, {
                        params: { regionCode: selectedRegionCode },
                        headers: getHeaders()
                    });
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        const mapped = res.data.map((c: any) => {
                            const code = String(c.code !== undefined && c.code !== null ? c.code : (c.cityCode !== undefined && c.cityCode !== null ? c.cityCode : "")).trim();
                            const rawName = String(c.name || c.nameUz || "").trim();
                            return {
                                code,
                                name: cyrillicToLatin(rawName),
                                regionCode: String(c.regionCode || "").trim()
                            };
                        }).filter((c: any) => c.code);
                        setCities(mapped);
                    } else {
                        throw new Error("Empty cities data");
                    }
                } catch (err) {
                    console.warn("Cities API failed, falling back to mock:", err);
                    const mockSource = MOCK_CITIES[selectedRegionCode] || [];
                    const mappedMock = mockSource.map((c) => ({
                        code: c.code,
                        name: cyrillicToLatin(c.name),
                        regionCode: c.regionCode
                    }));
                    setCities(mappedMock);
                } finally {
                    setLoadingCities(false);
                }
            };
            loadCities();
        } else {
            setCities([]);
        }
    }, [selectedRegionCode, token]);

    // Step 3: Fetch branches list on selecting a city
    useEffect(() => {
        if (selectedRegionCode && selectedCityCode) {
            const loadBranches = async () => {
                setLoadingBranches(true);
                setBranches([]);
                try {
                    const res = await api.get(`${BASE_URL}/api/bts/branches`, {
                        params: { regionCode: selectedRegionCode, cityCode: selectedCityCode },
                        headers: getHeaders()
                    });
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        const mapped = res.data.map((b: any) => {
                            const id = String(b.id !== undefined && b.id !== null ? b.id : (b.branchCode !== undefined && b.branchCode !== null ? b.branchCode : "")).trim();
                            const rawName = String(b.name || b.nameUz || "").trim();
                            const rawAddress = String(b.address || b.addressUz || "").trim();
                            return {
                                id,
                                nameUz: cyrillicToLatin(rawName),
                                addressUz: cyrillicToLatin(rawAddress),
                                phone: String(b.phone || "").trim(),
                                cityCode: String(b.cityCode || "").trim(),
                                regionCode: String(b.regionCode || "").trim()
                            };
                        }).filter((b: any) => b.id);
                        setBranches(mapped);
                    } else {
                        throw new Error("Empty branches data");
                    }
                } catch (err) {
                    console.warn("Branches API failed, falling back to mock:", err);
                    const mockSource = MOCK_BRANCHES[selectedCityCode] || [];
                    const mappedMock = mockSource.map((b) => ({
                        id: b.id,
                        nameUz: cyrillicToLatin(b.nameUz),
                        addressUz: cyrillicToLatin(b.addressUz),
                        phone: b.phone,
                        cityCode: b.cityCode,
                        regionCode: b.regionCode
                    }));
                    setBranches(mappedMock);
                } finally {
                    setLoadingBranches(false);
                }
            };
            loadBranches();
        } else {
            setBranches([]);
        }
    }, [selectedRegionCode, selectedCityCode, token]);

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
                                            <option key={region.code} value={region.code} className="text-slate-800 font-semibold">
                                                {region.name}
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
                                            <option key={city.code} value={city.code} className="text-slate-800 font-semibold">
                                                {city.name}
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
