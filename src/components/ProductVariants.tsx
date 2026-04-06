"use client";

import { useState, useMemo, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ProductType } from "../types";
import { useProductVariants } from "../hooks/useProductVariants";

interface ProductVariantsProps {
    productId: string | number;
    initialSelectedOptions?: Record<string, string>;
    onOptionChange?: (selected: Record<string, string>) => void;
    className?: string;
}

interface GroupedProductType {
    mainType: ProductType;
    options: ProductType[];
}

export function ProductVariants({
    productId,
    initialSelectedOptions = {},
    onOptionChange,
    className,
}: ProductVariantsProps) {
    const { data: variants = [], isLoading } = useProductVariants(productId);
    const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>(initialSelectedOptions);

    useEffect(() => {
        if (Object.keys(initialSelectedOptions).length > 0) {
            setSelectedVariant(initialSelectedOptions);
        }
    }, [initialSelectedOptions]);

    const groupedVariants = useMemo(() => {
        const mainTypes = variants.filter((v) => v.typeId === null);
        return mainTypes.map((main) => ({
            mainType: main,
            options: variants.filter((v) => v.typeId === main.id),
        })) as GroupedProductType[];
    }, [variants]);

    const handleSelect = (category: string, value: string) => {
        const next = { ...selectedVariant, [category]: value };
        setSelectedVariant(next);
        onOptionChange?.(next);
    };

    // Hide entire section while loading or if no data
    if (isLoading || groupedVariants.length === 0) return null;

    const isFlatList = groupedVariants.every(g => g.options.length === 0);

    return (
        <div className={cn("bg-white rounded-[1.25rem] border border-slate-200 p-5 shadow-sm space-y-6", className)}>
            {isFlatList ? (
                <div className="space-y-4">
                    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                        Variant tanlang
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {groupedVariants.map((group) => {
                            const option = group.mainType;
                            const isSelected = selectedVariant["type"] === option.name;
                            const isOutOfStock = (option.stock ?? 0) === 0;

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    disabled={isOutOfStock}
                                    onClick={() => handleSelect("type", option.name)}
                                    className={cn(
                                        "min-w-18 h-12 px-6 rounded-full text-[15px] font-bold transition-all outline-none flex flex-col items-center justify-center border relative gap-0.5",
                                        isSelected
                                            ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                            : "bg-white text-gray-900 border-gray-200 hover:border-blue-400",
                                        isOutOfStock && "opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200 overflow-hidden"
                                    )}
                                >
                                    <span>{option.name}</span>
                                    {!isOutOfStock && option.stock !== undefined && (
                                        <span className={cn("text-[9px] opacity-70 font-bold uppercase", isSelected ? "text-white" : "text-slate-500")}>
                                            {option.stock} dona
                                        </span>
                                    )}
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
            ) : (
                <div className="space-y-8">
                    {groupedVariants.map((group) => {
                        if (group.options.length === 0) return null;

                        return (
                            <div key={group.mainType.id} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                                        {group.mainType.name}
                                    </h3>
                                    {selectedVariant[group.mainType.name] && (
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50/50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-wider">
                                            {selectedVariant[group.mainType.name]}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {group.options.map((option) => {
                                        const isSelected = selectedVariant[group.mainType.name] === option.name;
                                        const isOutOfStock = (option.stock ?? 0) === 0;
                                        const isColorType = !!option.logoUrl;

                                        if (isColorType) {
                                            return renderColorSwatch(
                                                option,
                                                isSelected,
                                                isOutOfStock,
                                                () => handleSelect(group.mainType.name, option.name)
                                            );
                                        }

                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                disabled={isOutOfStock}
                                                onClick={() => handleSelect(group.mainType.name, option.name)}
                                                className={cn(
                                                    "min-w-18 h-12 px-6 rounded-full text-[15px] font-bold transition-all outline-none flex flex-col items-center justify-center border relative gap-0.5",
                                                    isSelected
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                                        : "bg-white text-gray-900 border-gray-200 hover:border-blue-400",
                                                    isOutOfStock && "opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200 overflow-hidden"
                                                )}
                                            >
                                                <span>{option.name}</span>
                                                {!isOutOfStock && option.stock !== undefined && (
                                                    <span className={cn("text-[9px] opacity-70 font-bold uppercase", isSelected ? "text-white" : "text-slate-500")}>
                                                        {option.stock} dona
                                                    </span>
                                                )}
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
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Render Helpers ────────────────────────────────────────────────
function renderColorSwatch(
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
                    ? "ring-2 ring-blue-600 ring-offset-2 scale-105"
                    : "border border-slate-200 hover:border-slate-400",
                isOutOfStock && "opacity-50 grayscale cursor-not-allowed ring-0 shadow-none border-slate-100"
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
                    <div className="w-[140%] h-[2px] bg-slate-500 rotate-45 rounded-full" />
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
