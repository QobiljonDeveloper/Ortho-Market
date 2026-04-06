"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductType } from "../types";

interface ProductVariantsProps {
    variants: ProductType[];
    selectedOptions: Record<string, string>;
    onOptionChange: (category: string, option: string) => void;
    className?: string;
}

interface GroupedProductType {
    mainType: ProductType;
    options: ProductType[];
}

export function ProductVariants({
    variants,
    selectedOptions,
    onOptionChange,
    className,
}: ProductVariantsProps) {
    // Mapping Logic: Group data by Main Type (typeId === null)
    const groupedVariants = useMemo(() => {
        const mainTypes = variants.filter((v) => v.typeId === null);
        return mainTypes.map((main) => ({
            mainType: main,
            options: variants.filter((v) => v.typeId === main.id),
        })) as GroupedProductType[];
    }, [variants]);

    if (groupedVariants.length === 0) return null;

    return (
        <div className={cn("space-y-8", className)}>
            {groupedVariants.map((group) => (
                <div key={group.mainType.id} className="space-y-4">
                    {/* Main Type Label */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                            {group.mainType.name}
                        </h3>
                        {selectedOptions[group.mainType.name] && (
                            <span className="text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-md">
                                {selectedOptions[group.mainType.name]}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {group.options.map((option) => {
                            const isSelected = selectedOptions[group.mainType.name] === option.name;
                            const isOutOfStock = option.stock === 0;

                            // UI Selection Logic
                            const isColorType = !!option.logoUrl;

                            if (isColorType) {
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        disabled={isOutOfStock}
                                        onClick={() => onOptionChange(group.mainType.name, option.name)}
                                        className={cn(
                                            "relative w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-white outline-none active:scale-95",
                                            isSelected
                                                ? "ring-2 ring-blue-600 ring-offset-2 scale-105"
                                                : "border border-slate-200 hover:border-slate-300 hover:scale-[1.02]",
                                            isOutOfStock && "opacity-40 grayscale cursor-not-allowed hover:scale-100 ring-0"
                                        )}
                                        title={option.name}
                                    >
                                        {/* Color Swatch */}
                                        <div
                                            className="w-full h-full rounded-[10px] border border-black/5"
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

                                        {/* Selected Checkmark */}
                                        {isSelected && (
                                            <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-200">
                                                <Check
                                                    className={cn("w-5 h-5", isLightColor(option.logoUrl || "") ? "text-slate-900" : "text-white")}
                                                    strokeWidth={4}
                                                />
                                            </div>
                                        )}

                                        {/* Out of Stock Strike-through */}
                                        {isOutOfStock && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                                                <div className="w-[140%] h-[2px] bg-slate-500 rotate-45 rounded-full" />
                                            </div>
                                        )}
                                    </button>
                                );
                            }

                            // Pill Style (Size, etc.)
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    disabled={isOutOfStock}
                                    onClick={() => onOptionChange(group.mainType.name, option.name)}
                                    className={cn(
                                        "min-w-16 h-12 px-5 rounded-xl text-[15px] font-bold transition-all outline-none flex items-center justify-center active:scale-95 border",
                                        isSelected
                                            ? "bg-blue-50 border-blue-600 text-blue-600 shadow-sm"
                                            : "bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600",
                                        isOutOfStock && "opacity-40 bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed overflow-hidden relative"
                                    )}
                                >
                                    {option.name}
                                    {isOutOfStock && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-[110%] h-[1.5px] bg-slate-400 rotate-15 rounded-full" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Helpers ────────────────────────────────────────────────
function isLightColor(color: string): boolean {
    if (!color || color.startsWith("http")) return true;
    const hex = color.replace("#", "");
    if (hex.length !== 6) return true;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}
