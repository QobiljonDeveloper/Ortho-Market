"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useProductVariants } from "../hooks/useProductVariants";

interface ProductVariantsProps {
    productId: string | number;
    initialSelectedOptions?: Record<string, string>;
    onOptionChange?: (selected: Record<string, string>) => void;
    className?: string;
}

interface VariantItem {
    id: number;
    name: string;
    stock?: number;
    logoUrl?: string;
    children?: VariantItem[];
}

export function ProductVariants({
    productId,
    onOptionChange,
    className,
}: ProductVariantsProps) {
    const { data: productTypes = [], isLoading } = useProductVariants(productId);
    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

    const handleParentSelect = (parent: VariantItem) => {
        setSelectedParentId(parent.id);
        setSelectedChildId(null); // Always reset child when parent changes

        // If parent has no children, it IS the final selection
        if (!parent.children || parent.children.length === 0) {
            onOptionChange?.({ type: parent.name, typeId: String(parent.id) });
        } else {
            // Parent selected but child not yet chosen
            onOptionChange?.({ type: parent.name, typeId: "" });
        }
    };

    const handleChildSelect = (child: VariantItem, parentName: string) => {
        setSelectedChildId(child.id);
        onOptionChange?.({ type: parentName, subType: child.name, typeId: String(child.id) });
    };

    // Hide entire section while loading or if no data
    if (isLoading || productTypes.length === 0) return null;

    const selectedParent: VariantItem | undefined = (productTypes as VariantItem[]).find(
        (p) => p.id === selectedParentId
    );
    const childrenList = selectedParent?.children ?? [];

    return (
        <div className={cn("bg-white rounded-[1.25rem] border border-slate-200 p-5 shadow-sm space-y-5", className)}>
            {/* ── Parent Variants Row ─────────────────────────── */}
            <div className="space-y-3">
                <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    Variant tanlang
                </h3>
                <div className="flex flex-wrap gap-2.5">
                    {(productTypes as VariantItem[]).map((parent) => {
                        const isSelected = selectedParentId === parent.id;
                        const isOutOfStock = (parent.stock ?? 0) === 0;

                        return (
                            <button
                                key={parent.id}
                                type="button"
                                disabled={isOutOfStock}
                                onClick={() => handleParentSelect(parent)}
                                className={cn(
                                    "shrink-0 flex flex-col items-center justify-center min-w-[5.5rem] h-14 px-4 rounded-2xl border transition-all duration-200 relative",
                                    isSelected
                                        ? "border-[#007AFF] bg-[#F0F8FF] shadow-sm"
                                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                                    isOutOfStock && "opacity-40 cursor-not-allowed bg-slate-50 border-slate-100 overflow-hidden"
                                )}
                            >
                                <span className={cn(
                                    "text-[14px] font-bold tracking-tight leading-tight",
                                    isSelected ? "text-[#007AFF]" : "text-slate-900"
                                )}>
                                    {parent.name}
                                </span>
                                {parent.stock !== undefined && !isOutOfStock && (
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase mt-0.5",
                                        isSelected ? "text-[#007AFF]/70" : "text-slate-400"
                                    )}>
                                        {parent.stock} dona
                                    </span>
                                )}
                                {isOutOfStock && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-[110%] h-[1.5px] bg-slate-400 rotate-[15deg] rounded-full" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Conditional Child Variants Row ──────────────── */}
            {selectedParent && childrenList.length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                        {selectedParent.name} — turini tanlang
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                        {childrenList.map((child) => {
                            const isSelected = selectedChildId === child.id;
                            const isOutOfStock = (child.stock ?? 0) === 0;

                            return (
                                <button
                                    key={child.id}
                                    type="button"
                                    disabled={isOutOfStock}
                                    onClick={() => handleChildSelect(child, selectedParent.name)}
                                    className={cn(
                                        "shrink-0 flex flex-col items-center justify-center min-w-[5.5rem] h-14 px-4 rounded-2xl border transition-all duration-200 relative",
                                        isSelected
                                            ? "border-[#007AFF] bg-[#F0F8FF] shadow-sm"
                                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                                        isOutOfStock && "opacity-40 cursor-not-allowed bg-slate-50 border-slate-100 overflow-hidden"
                                    )}
                                >
                                    <span className={cn(
                                        "text-[14px] font-bold tracking-tight leading-tight",
                                        isSelected ? "text-[#007AFF]" : "text-slate-900"
                                    )}>
                                        {child.name}
                                    </span>
                                    {child.stock !== undefined && !isOutOfStock && (
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase mt-0.5",
                                            isSelected ? "text-[#007AFF]/70" : "text-slate-400"
                                        )}>
                                            {child.stock} dona
                                        </span>
                                    )}
                                    {isOutOfStock && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-[110%] h-[1.5px] bg-slate-400 rotate-[15deg] rounded-full" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
