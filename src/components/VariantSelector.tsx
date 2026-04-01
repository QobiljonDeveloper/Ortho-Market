"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
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
                        "rounded-2xl p-4 transition-all duration-300",
                        "glass-surface",
                        validationErrors?.color && "animate-shake border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                    )}
                >
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/50 mb-3">
                        Rang{" "}
                        {selected.color && (
                            <span className="text-white/80 normal-case tracking-normal ml-1">
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
                                <motion.button
                                    key={`${color.name}-${color.hex}`}
                                    type="button"
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => selectColor(color)}
                                    className={cn(
                                        "relative w-10 h-10 rounded-full transition-all duration-200 outline-none",
                                        "ring-2 ring-offset-2 ring-offset-[#1a1a2e]",
                                        isSelected
                                            ? "ring-[#007AFF] animate-neon-pulse"
                                            : "ring-white/10 hover:ring-white/30"
                                    )}
                                    title={color.name}
                                >
                                    <span
                                        className="absolute inset-1 rounded-full border border-white/20"
                                        style={{ backgroundColor: color.hex }}
                                    />
                                    {isSelected && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute inset-0 flex items-center justify-center"
                                        >
                                            <Check
                                                className={cn(
                                                    "w-4 h-4 drop-shadow-lg",
                                                    isLightColor(color.hex)
                                                        ? "text-slate-900"
                                                        : "text-white"
                                                )}
                                                strokeWidth={3}
                                            />
                                        </motion.span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Size / Model Buttons ──────────────────────── */}
            {hasSizes && (
                <div
                    className={cn(
                        "rounded-2xl p-4 transition-all duration-300",
                        "glass-surface",
                        validationErrors?.size && "animate-shake border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                    )}
                >
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/50 mb-3">
                        O'lcham
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => {
                            const isSelected = selected.size?.value === size.value;
                            return (
                                <motion.button
                                    key={size.value}
                                    type="button"
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => selectSize(size)}
                                    className={cn(
                                        "min-w-[48px] h-11 px-4 rounded-xl text-sm font-semibold transition-all duration-200 outline-none",
                                        isSelected
                                            ? "bg-[#007AFF] text-white shadow-[0_0_20px_rgba(0,122,255,0.35)]"
                                            : "glass-surface text-white/70 hover:text-white hover:bg-white/10"
                                    )}
                                >
                                    {size.label}
                                </motion.button>
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
