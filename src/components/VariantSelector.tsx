"use client";

import { useCallback } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
    ProductVariantColor,
    ProductVariantSize,
    SelectedVariants,
} from "../types";

// ── Types ──────────────────────────────────────────────────
export interface VariantValidationErrors {
    color?: boolean;
    size?: boolean;
}

interface VariantSelectorProps {
    colors?: ProductVariantColor[];
    sizes?: ProductVariantSize[];
    selected: SelectedVariants;
    onChange: (selected: SelectedVariants) => void;
    validationErrors?: VariantValidationErrors;
    className?: string;
}

// ── Component ──────────────────────────────────────────────
export function VariantSelector({
    colors,
    sizes,
    selected,
    onChange,
    validationErrors,
    className,
}: VariantSelectorProps) {
    const selectColor = useCallback(
        (color: ProductVariantColor) => {
            onChange({ ...selected, color });
        },
        [selected, onChange]
    );

    const selectSize = useCallback(
        (size: ProductVariantSize) => {
            onChange({ ...selected, size });
        },
        [selected, onChange]
    );

    const hasColors = colors && colors.length > 0;
    const hasSizes = sizes && sizes.length > 0;

    if (!hasColors && !hasSizes) return null;

    return (
        <div className={cn("space-y-5", className)}>
            {/* ── Color Swatches ────────────────────────────── */}
            {hasColors && (
                <div
                    className={cn(
                        "rounded-2xl bg-slate-50 p-4 transition-all duration-300 border",
                        validationErrors?.color
                            ? "animate-shake border-red-400"
                            : "border-transparent"
                    )}
                >
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
                        Rangni tanlang
                        {selected.color && (
                            <span className="text-slate-800 normal-case tracking-normal font-bold ml-1.5">
                                — {selected.color.name}
                            </span>
                        )}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {colors.map((color) => {
                            const isSelected =
                                selected.color?.hex === color.hex &&
                                selected.color?.name === color.name;
                            return (
                                <button
                                    key={`${color.name}-${color.hex}`}
                                    type="button"
                                    onClick={() => selectColor(color)}
                                    className={cn(
                                        "relative w-10 h-10 rounded-full transition-all duration-200 outline-none active:scale-90",
                                        isSelected
                                            ? "ring-2 ring-blue-500 ring-offset-2"
                                            : "ring-1 ring-slate-200 hover:ring-slate-300"
                                    )}
                                    title={color.name}
                                >
                                    <span
                                        className="absolute inset-0.5 rounded-full"
                                        style={{ backgroundColor: color.hex }}
                                    />
                                    {isSelected && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <Check
                                                className={cn(
                                                    "w-4 h-4 drop-shadow-sm",
                                                    isLightColor(color.hex) ? "text-slate-800" : "text-white"
                                                )}
                                                strokeWidth={3}
                                            />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Size / Model Buttons ──────────────────────── */}
            {hasSizes && (
                <div
                    className={cn(
                        "rounded-2xl bg-slate-50 p-4 transition-all duration-300 border",
                        validationErrors?.size
                            ? "animate-shake border-red-400"
                            : "border-transparent"
                    )}
                >
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
                        O'lcham / Model
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => {
                            const isSelected = selected.size?.value === size.value;
                            return (
                                <button
                                    key={size.value}
                                    type="button"
                                    onClick={() => selectSize(size)}
                                    className={cn(
                                        "min-w-[48px] h-11 px-4 rounded-xl text-sm font-semibold transition-all duration-200 outline-none active:scale-95 border",
                                        isSelected
                                            ? "bg-blue-50 border-blue-500 text-blue-600"
                                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                                    )}
                                >
                                    {size.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Helpers ────────────────────────────────────────────────
function isLightColor(hex: string): boolean {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}
