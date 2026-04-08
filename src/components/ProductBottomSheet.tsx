import { useState, useCallback } from "react";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetDescription,
} from "./ui/sheet";
import {
    MockVariantSelector,
    type MockValidationErrors,
} from "./MockVariantSelector";

// ── Mock Product Data ──────────────────────────────────────
const MOCK_PRODUCT = {
    title: "Ortodontik yuz niqobi",
    price: "358,400 so'm",
    imageUrl: "", // empty = placeholder shown
};

// ── Types ──────────────────────────────────────────────────
interface MockColor {
    name: string;
    hex: string;
}

interface MockSize {
    label: string;
    value: string;
}

interface ProductBottomSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// ── Component ──────────────────────────────────────────────
export function ProductBottomSheet({
    open,
    onOpenChange,
}: ProductBottomSheetProps) {
    const [selectedColor, setSelectedColor] = useState<MockColor | null>(null);
    const [selectedSize, setSelectedSize] = useState<MockSize | null>(null);
    const [errors, setErrors] = useState<MockValidationErrors>({});

    const handleConfirm = useCallback(() => {
        const newErrors: MockValidationErrors = {};
        let hasError = false;

        if (!selectedColor) {
            newErrors.color = true;
            hasError = true;
        }
        if (!selectedSize) {
            newErrors.size = true;
            hasError = true;
        }

        if (hasError) {
            setErrors(newErrors);
            setTimeout(() => setErrors({}), 600);
            return;
        }

        // ✅ Success — mock add-to-cart
        onOpenChange(false);

        // Reset on close
        setTimeout(() => {
            setSelectedColor(null);
            setSelectedSize(null);
        }, 300);
    }, [selectedColor, selectedSize, onOpenChange]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className={cn(
                    "w-full rounded-t-4xl flex flex-col bg-white border-t border-slate-200 p-0 text-slate-900",
                    "shadow-[0_-8px_40px_rgba(0,0,0,0.08)]",
                    "max-h-[85vh]"
                )}
            >
                {/* ── Accessibility: sr-only Title ─────────────── */}
                <SheetTitle className="sr-only">Mahsulot xususiyatlari</SheetTitle>
                <SheetDescription className="sr-only">Mahsulot variant tanlash oynasi</SheetDescription>

                {/* ── Drag Handle ──────────────────────────────── */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-slate-200" />
                </div>

                {/* ── Product Summary ──────────────────────────── */}
                <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100">
                    {/* Mock Thumbnail */}
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {MOCK_PRODUCT.imageUrl ? (
                            <img
                                src={MOCK_PRODUCT.imageUrl}
                                alt={MOCK_PRODUCT.title}
                                className="w-full h-full object-contain p-1.5"
                            />
                        ) : (
                            <span className="text-2xl">🦷</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-slate-800 font-semibold text-[15px] leading-snug line-clamp-2">
                            {MOCK_PRODUCT.title}
                        </h3>
                        <p className="text-blue-500 font-bold text-lg mt-0.5">
                            {MOCK_PRODUCT.price}
                        </p>
                    </div>
                </div>

                {/* ── Variant Selector ─────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-hide">
                    <MockVariantSelector
                        selectedColor={selectedColor}
                        selectedSize={selectedSize}
                        onColorChange={setSelectedColor}
                        onSizeChange={setSelectedSize}
                        validationErrors={errors}
                    />
                </div>

                {/* ── Sticky Confirm Button ────────────────────── */}
                <div className="p-5 pt-3 shrink-0 border-t border-slate-100 bg-white">
                    <button
                        onClick={handleConfirm}
                        className={cn(
                            "w-full h-[52px] rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5",
                            "bg-blue-500 text-white shadow-sm",
                            "hover:bg-blue-600",
                            "active:scale-[0.97] transition-all duration-200"
                        )}
                    >
                        <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />
                        Savatga qo'shish
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
