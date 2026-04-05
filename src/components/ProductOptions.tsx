import React, { useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

// --- Types & Mock Data --- //
export interface Variant {
    id: string;
    colorId: string;
    sizeId: string;
    price: number;
    stock: number;
    imageUrl: string;
}

export interface ColorData {
    id: string;
    name: string;
    hex: string;
}

export interface SizeData {
    id: string;
    name: string;
}

export const mockProductData = {
    id: 'prod_ortho_1',
    title: 'Premium Knee Support Brace',
    basePrice: 89.99,
    colors: [
        { id: 'c1', name: 'Medical Blue', hex: '#0070f3' },
        { id: 'c2', name: 'Slate Gray', hex: '#64748b' },
        { id: 'c3', name: 'Clinical White', hex: '#ffffff' },
        { id: 'c4', name: 'Midnight Black', hex: '#0f172a' },
    ],
    sizes: [
        { id: 's1', name: 'S' },
        { id: 's2', name: 'M' },
        { id: 's3', name: 'L' },
        { id: 's4', name: 'XL' },
        { id: 's5', name: 'XXL' },
    ],
    variants: [
        // Available Matrix
        { id: 'v1', colorId: 'c1', sizeId: 's1', price: 89.99, stock: 15, imageUrl: 'https://placehold.co/600x600/0070f3/ffffff?text=Blue+S' },
        { id: 'v2', colorId: 'c1', sizeId: 's2', price: 89.99, stock: 20, imageUrl: 'https://placehold.co/600x600/0070f3/ffffff?text=Blue+M' },
        { id: 'v3', colorId: 'c1', sizeId: 's3', price: 94.99, stock: 0, imageUrl: 'https://placehold.co/600x600/0070f3/ffffff?text=Blue+L' }, // Out of stock
        { id: 'v4', colorId: 'c1', sizeId: 's4', price: 94.99, stock: 5, imageUrl: 'https://placehold.co/600x600/0070f3/ffffff?text=Blue+XL' },

        { id: 'v5', colorId: 'c2', sizeId: 's2', price: 89.99, stock: 12, imageUrl: 'https://placehold.co/600x600/64748b/ffffff?text=Gray+M' },
        { id: 'v6', colorId: 'c2', sizeId: 's3', price: 94.99, stock: 8, imageUrl: 'https://placehold.co/600x600/64748b/ffffff?text=Gray+L' },
        { id: 'v6_oos', colorId: 'c2', sizeId: 's4', price: 94.99, stock: 0, imageUrl: 'https://placehold.co/600x600/64748b/ffffff?text=Gray+XL' },

        { id: 'v7', colorId: 'c3', sizeId: 's2', price: 89.99, stock: 8, imageUrl: 'https://placehold.co/600x600/ffffff/0f172a?text=White+M' },
        { id: 'v8', colorId: 'c3', sizeId: 's5', price: 99.99, stock: 4, imageUrl: 'https://placehold.co/600x600/ffffff/0f172a?text=White+XXL' },

        { id: 'v9', colorId: 'c4', sizeId: 's3', price: 94.99, stock: 10, imageUrl: 'https://placehold.co/600x600/0f172a/ffffff?text=Black+L' },
        { id: 'v10', colorId: 'c4', sizeId: 's5', price: 99.99, stock: 10, imageUrl: 'https://placehold.co/600x600/0f172a/ffffff?text=Black+XXL' },
    ]
};

// --- Component --- //
export function ProductOptions() {
    const { colors, sizes, variants } = mockProductData;

    // Initialize with first available color and size
    const [selectedColor, setSelectedColor] = useState<string | null>(colors[0].id);
    const [selectedSize, setSelectedSize] = useState<string | null>(sizes[1].id); // S2 (M) happens to be in stock for C1

    const currentVariant = useMemo(() => {
        return variants.find(v => v.colorId === selectedColor && v.sizeId === selectedSize);
    }, [selectedColor, selectedSize, variants]);

    const currentSettings = useMemo(() => {
        const c = colors.find(c => c.id === selectedColor);
        const s = sizes.find(s => s.id === selectedSize);
        return { color: c, size: s };
    }, [selectedColor, selectedSize, colors, sizes]);

    // Check if a size has stock available in the currently selected color
    const isSizeAvailable = (sizeId: string) => {
        if (!selectedColor) return false;
        const variant = variants.find(v => v.colorId === selectedColor && v.sizeId === sizeId);
        return variant ? variant.stock > 0 : false;
    };

    // Check if a color has stock available in the currently selected size
    const isColorAvailable = (colorId: string) => {
        if (!selectedSize) return true; // Show color availability globally if no size is chosen
        const variant = variants.find(v => v.colorId === colorId && v.sizeId === selectedSize);
        return variant ? variant.stock > 0 : false;
    };

    const handleColorSelect = (colorId: string) => {
        setSelectedColor(colorId);

        // Auto-select first available size if the current size becomes out of stock for the newly picked color
        const currentSizeVariant = variants.find(v => v.colorId === colorId && v.sizeId === selectedSize);
        if (!currentSizeVariant || currentSizeVariant.stock <= 0) {
            const firstAvailableVariant = variants.find(v => v.colorId === colorId && v.stock > 0);
            if (firstAvailableVariant) {
                setSelectedSize(firstAvailableVariant.sizeId);
            }
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full max-w-6xl mx-auto p-4 md:p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100">

            {/* --- Image Section --- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 rounded-3xl aspect-square md:aspect-[4/3] lg:aspect-square overflow-hidden relative">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentVariant?.imageUrl || selectedColor || 'placeholder'}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        src={currentVariant?.imageUrl || 'https://placehold.co/600x600/f8fafc/slate?text=Select+Variant'}
                        alt={`${mockProductData.title} Variant`}
                        className="w-full h-full object-cover mix-blend-multiply"
                    />
                </AnimatePresence>
            </div>

            {/* --- Interactive Options Section --- */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center space-y-8">

                {/* Header & Price */}
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                        {mockProductData.title}
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-4xl font-bold text-blue-600 tracking-tight">
                            ${currentVariant ? currentVariant.price.toFixed(2) : mockProductData.basePrice.toFixed(2)}
                        </span>
                        {currentVariant && currentVariant.stock < 10 && currentVariant.stock > 0 && (
                            <span className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-sm">
                                Only {currentVariant.stock} left
                            </span>
                        )}
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Selected Status Text */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <p className="text-slate-600">
                        Selected Variant:
                    </p>
                    <div className="text-slate-900 font-bold">
                        {currentSettings.color?.name || 'None'} <span className="text-slate-300 mx-1">/</span> {currentSettings.size?.name || 'None'}
                    </div>
                </div>

                {/* Colors Selection */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Color
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {colors.map(color => {
                            const available = isColorAvailable(color.id);
                            const isSelected = selectedColor === color.id;

                            return (
                                <div key={color.id} className="relative group">
                                    <button
                                        onClick={() => handleColorSelect(color.id)}
                                        aria-label={`Select color ${color.name}`}
                                        className={cn(
                                            "w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-blue-100 group-hover:scale-105",
                                            isSelected ? "border-blue-500 shadow-md scale-105" : "border-slate-200 hover:border-slate-300",
                                            !available && "opacity-50 grayscale hover:scale-100 cursor-not-allowed" // Medical / clean out-of-stock feel
                                        )}
                                        style={{ backgroundColor: color.hex }}
                                    >
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                className="z-10"
                                            >
                                                <Check
                                                    className={cn("w-6 h-6", color.hex === '#ffffff' ? "text-slate-900" : "text-white")}
                                                    strokeWidth={3}
                                                />
                                            </motion.div>
                                        )}

                                        {/* Diagonal strike-through for out of stock colors */}
                                        {!available && (
                                            <div
                                                className="absolute w-[150%] h-[3px] bg-slate-400 rotate-45 z-20 pointer-events-none"
                                                style={{ transformOrigin: 'center' }}
                                            />
                                        )}
                                    </button>

                                    {/* Enhanced Tooltip */}
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                        {color.name} {!available && <span className="text-slate-400 ml-1">(Unavailable)</span>}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Sizes Selection */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                            Size
                        </h3>
                        <button className="text-sm text-blue-600 font-medium hover:underline focus:outline-none">
                            Size Guide
                        </button>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                        {sizes.map(size => {
                            const available = isSizeAvailable(size.id);
                            const isSelected = selectedSize === size.id;

                            return (
                                <button
                                    key={size.id}
                                    onClick={() => available && setSelectedSize(size.id)}
                                    disabled={!available}
                                    className={cn(
                                        "relative min-w-[3rem] h-14 rounded-xl text-base font-bold transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 flex items-center justify-center",
                                        isSelected
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 border-2 border-transparent"
                                            : "bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50",
                                        !available && "opacity-40 bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed hover:bg-slate-50 hover:text-slate-400 hover:border-slate-200 empty:hover:scale-100"
                                    )}
                                >
                                    <span className="relative z-10">{size.name}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Action Area */}
                <div className="pt-6 mt-4">
                    <button
                        className={cn(
                            "w-full h-16 rounded-2xl text-white font-bold text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2",
                            currentVariant && currentVariant.stock > 0
                                ? "bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20"
                                : "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                        )}
                        disabled={!currentVariant || currentVariant.stock <= 0}
                    >
                        {currentVariant && currentVariant.stock > 0 ? (
                            <span>Add to Cart - ${currentVariant.price.toFixed(2)}</span>
                        ) : (
                            <span>Currently Unavailable</span>
                        )}
                    </button>

                    {/* Subtle medical reassurance text */}
                    <p className="mt-4 text-center text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 text-green-500" /> Free Returns within 30 days
                    </p>
                </div>

            </div>
        </div>
    );
}
