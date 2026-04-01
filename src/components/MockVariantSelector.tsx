import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mock Data ──────────────────────────────────────────────
const MOCK_COLORS = [
    { name: "Oq", hex: "#FFFFFF" },
    { name: "Qora", hex: "#1A1A1A" },
    { name: "Kulrang", hex: "#9CA3AF" },
    { name: "Ko'k", hex: "#3B82F6" },
] as const;

const MOCK_SIZES = [
    { label: "0.14 mm", value: "0.14" },
    { label: "0.16 mm", value: "0.16" },
    { label: "0.18 mm", value: "0.18" },
    { label: "Standart", value: "standard" },
] as const;

// ── Types ──────────────────────────────────────────────────
interface MockColor {
    name: string;
    hex: string;
}

interface MockSize {
    label: string;
    value: string;
}

export interface MockValidationErrors {
    color?: boolean;
    size?: boolean;
}

interface MockVariantSelectorProps {
    selectedColor: MockColor | null;
    selectedSize: MockSize | null;
    onColorChange: (color: MockColor) => void;
    onSizeChange: (size: MockSize) => void;
    validationErrors?: MockValidationErrors;
    className?: string;
}

// ── Component ──────────────────────────────────────────────
export function MockVariantSelector({
    selectedColor,
    selectedSize,
    onColorChange,
    onSizeChange,
    validationErrors,
    className,
}: MockVariantSelectorProps) {
    return (
        <div className={cn("space-y-5", className)}>
            {/* ── Color Swatches ────────────────────────────── */}
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
                    {selectedColor && (
                        <span className="text-slate-800 normal-case tracking-normal font-bold ml-1.5">
                            — {selectedColor.name}
                        </span>
                    )}
                </p>
                <div className="flex flex-wrap gap-3">
                    {MOCK_COLORS.map((color) => {
                        const isSelected = selectedColor?.hex === color.hex;
                        const isLight =
                            color.hex === "#FFFFFF" ||
                            parseInt(color.hex.replace("#", ""), 16) > 0xcccccc;
                        return (
                            <button
                                key={color.hex}
                                type="button"
                                onClick={() => onColorChange({ name: color.name, hex: color.hex })}
                                className={cn(
                                    "relative w-10 h-10 rounded-full transition-all duration-200 outline-none active:scale-90",
                                    isSelected
                                        ? "ring-2 ring-blue-500 ring-offset-2"
                                        : "ring-1 ring-slate-200 hover:ring-slate-300"
                                )}
                                title={color.name}
                            >
                                <span
                                    className={cn(
                                        "absolute inset-0.5 rounded-full",
                                        color.hex === "#FFFFFF" && "border border-slate-200"
                                    )}
                                    style={{ backgroundColor: color.hex }}
                                />
                                {isSelected && (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <Check
                                            className={cn(
                                                "w-4 h-4 drop-shadow-sm",
                                                isLight ? "text-slate-800" : "text-white"
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

            {/* ── Size / Model Buttons ──────────────────────── */}
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
                    {MOCK_SIZES.map((size) => {
                        const isSelected = selectedSize?.value === size.value;
                        return (
                            <button
                                key={size.value}
                                type="button"
                                onClick={() => onSizeChange({ label: size.label, value: size.value })}
                                className={cn(
                                    "min-w-[56px] h-11 px-4 rounded-xl text-sm font-semibold transition-all duration-200 outline-none active:scale-95 border",
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
        </div>
    );
}

// ── Standalone usage with internal state ───────────────────
export function MockVariantSelectorStandalone() {
    const [selectedColor, setSelectedColor] = useState<MockColor | null>(null);
    const [selectedSize, setSelectedSize] = useState<MockSize | null>(null);

    return (
        <MockVariantSelector
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            onColorChange={setSelectedColor}
            onSizeChange={setSelectedSize}
        />
    );
}
