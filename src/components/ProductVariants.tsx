import { useState, useMemo, useEffect } from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { type ProductType } from "../types";
import { useProductVariants } from "../hooks/useProductVariants";

interface ProductVariantsProps {
    productId: string | number;
    initialSelectedOptions?: Record<string, string>;
    onOptionChange?: (selected: Record<string, string>) => void;
    className?: string;
}

export function ProductVariants({
    productId,
    initialSelectedOptions = {},
    onOptionChange,
    className,
}: ProductVariantsProps) {
    const { data: variants = [], isLoading } = useProductVariants(productId);

    // Step 1: All Main Types (typeId === null)
    const mainTypes = useMemo(() => variants.filter(v => v.typeId === null), [variants]);

    // State for Top-level and Child-level selection
    const [selectedMainId, setSelectedMainId] = useState<number | string | null>(null);
    const [selectedChildId, setSelectedChildId] = useState<number | string | null>(null);

    // Sync with initialSelectedOptions if provided
    useEffect(() => {
        if (Object.keys(initialSelectedOptions).length > 0 && variants.length > 0) {
            // This is complex because we need to map back names to IDs
            // For now, let's just use IDs internally
        }
    }, [initialSelectedOptions, variants]);

    // Handle Main Selection
    const handleMainSelect = (main: ProductType) => {
        setSelectedMainId(main.id);
        setSelectedChildId(null); // Reset child on parent change

        // Find if it has children
        const children = variants.filter(v => v.typeId === main.id);

        // Notify parent: if it's a flat type (no children), it's the final selection
        if (children.length === 0) {
            onOptionChange?.({ main: main.name, type: main.name });
        } else {
            // Notify parent that selection is in progress
            onOptionChange?.({ main: main.name });
        }
    };

    // Handle Child Selection
    const handleChildSelect = (child: ProductType) => {
        setSelectedChildId(child.id);
        const main = mainTypes.find(m => m.id === selectedMainId);
        onOptionChange?.({
            main: main?.name || "",
            child: child.name,
            type: `${main?.name} - ${child.name}`
        });
    };

    const selectedMainChildren = useMemo(() => {
        if (!selectedMainId) return [];
        return variants.filter(v => v.typeId === selectedMainId);
    }, [selectedMainId, variants]);

    if (isLoading) return null;
    if (mainTypes.length === 0) return null;

    return (
        <div className={cn("space-y-8", className)}>
            {/* ── STEP 1: Main Types ─────────────────────── */}
            <div className="space-y-4">
                <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    Variant tanlang
                </h3>
                <div className="flex flex-wrap gap-3">
                    {mainTypes.map((main) => {
                        const isSelected = selectedMainId === main.id;
                        const isOutOfStock = (main.stock ?? 0) === 0 && variants.filter(v => v.typeId === main.id).every(c => (c.stock ?? 0) === 0);
                        const isColor = !!main.logoUrl;

                        if (isColor) {
                            return renderSwatch(main, isSelected, isOutOfStock, () => handleMainSelect(main));
                        }

                        return (
                            <button
                                key={main.id}
                                type="button"
                                disabled={isOutOfStock}
                                onClick={() => handleMainSelect(main)}
                                className={cn(
                                    "min-w-18 h-12 px-6 rounded-full text-[15px] font-bold transition-all outline-none flex flex-col items-center justify-center border relative gap-0.5",
                                    isSelected
                                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20 scale-105"
                                        : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/30",
                                    isOutOfStock && "opacity-40 grayscale cursor-not-allowed bg-slate-50 overflow-hidden"
                                )}
                            >
                                <span>{main.name}</span>
                                {isOutOfStock && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-full">
                                        <div className="w-[140%] h-[1.5px] bg-slate-400 rotate-15" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── STEP 2: Child Types ────────────────────── */}
            <AnimatePresence mode="wait">
                {selectedMainChildren.length > 0 && (
                    <motion.div
                        key={selectedMainId}
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                            opacity: { duration: 0.2 }
                        }}
                        className="space-y-4 overflow-hidden pt-2"
                    >
                        <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest px-1">
                            Qo'shimcha variant
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {selectedMainChildren.map((child) => {
                                const isSelected = selectedChildId === child.id;
                                const isOutOfStock = (child.stock ?? 0) === 0;
                                const isColor = !!child.logoUrl;

                                if (isColor) {
                                    return renderSwatch(child, isSelected, isOutOfStock, () => handleChildSelect(child));
                                }

                                return (
                                    <button
                                        key={child.id}
                                        type="button"
                                        disabled={isOutOfStock}
                                        onClick={() => handleChildSelect(child)}
                                        className={cn(
                                            "min-w-18 h-12 px-6 rounded-full text-[15px] font-bold transition-all outline-none flex flex-col items-center justify-center border relative gap-0.5",
                                            isSelected
                                                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20 scale-105"
                                                : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/30",
                                            isOutOfStock && "opacity-40 grayscale cursor-not-allowed bg-slate-50 overflow-hidden"
                                        )}
                                    >
                                        <span>{child.name}</span>
                                        {isOutOfStock && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-full">
                                                <div className="w-[140%] h-[1.5px] bg-slate-400 rotate-15" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Shared Swatch Helper ──────────────────────────────────────────
function renderSwatch(
    option: ProductType,
    isSelected: boolean,
    isOutOfStock: boolean,
    onClick: () => void,
) {
    return (
        <button
            key={option.id}
            type="button"
            disabled={isOutOfStock}
            onClick={onClick}
            className={cn(
                "relative w-14 h-14 rounded-full flex items-center justify-center transition-all bg-white outline-none p-1",
                isSelected
                    ? "ring-2 ring-blue-600 ring-offset-2 scale-110 shadow-lg"
                    : "border border-slate-200 hover:border-slate-400 hover:scale-105",
                isOutOfStock && "opacity-40 grayscale cursor-not-allowed ring-0 shadow-none border-slate-100"
            )}
            title={option.name}
        >
            <div
                className="w-full h-full rounded-full border border-black/5"
                style={{
                    backgroundImage: option.logoUrl?.startsWith("http")
                        ? `url(${option.logoUrl})`
                        : undefined,
                    backgroundColor: !option.logoUrl?.startsWith("http")
                        ? option.logoUrl
                        : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Check
                        className={cn("w-6 h-6", isLightColor(option.logoUrl || "") ? "text-slate-900" : "text-white")}
                        strokeWidth={4}
                    />
                </div>
            )}
            {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-full">
                    <div className="w-[140%] h-[2px] bg-slate-500 rotate-45" />
                </div>
            )}
        </button>
    );
}

function isLightColor(color: string): boolean {
    if (!color || color.startsWith("http")) return true;
    const hex = color.replace("#", "");
    if (hex.length !== 6) return true;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}
