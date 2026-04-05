import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

// --- MOCK DATA --- //
const MOCK_PRODUCT_OPTIONS = {
    colors: [
        { id: 'red', name: 'Qizil', colorCode: '#e53e3e', image: 'https://placehold.co/600x600/e53e3e/ffffff?text=Qizil' },
        { id: 'blue', name: 'Ko\'k', colorCode: '#0070f3', image: 'https://placehold.co/600x600/0070f3/ffffff?text=Kok' },
        { id: 'white', name: 'Oq', colorCode: '#ffffff', image: 'https://placehold.co/600x600/ffffff/111827?text=Oq' },
        { id: 'black', name: 'Qora', colorCode: '#111827', image: 'https://placehold.co/600x600/111827/ffffff?text=Qora' }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    variantMap: {
        // Red stock
        'red_S': true,
        'red_M': true,
        'red_L': false,
        'red_XL': false,
        'red_XXL': false,
        // Blue stock
        'blue_S': true,
        'blue_M': true,
        'blue_L': true,
        'blue_XL': true,
        'blue_XXL': false,
        // White stock (Simulating completely out of stock color)
        'white_S': false,
        'white_M': false,
        'white_L': false,
        'white_XL': false,
        'white_XXL': false,
        // Black stock
        'black_S': false,
        'black_M': true,
        'black_L': true,
        'black_XL': false,
        'black_XXL': true,
    } as Record<string, boolean>
};

export function StaticProductOptions() {
    const { colors, sizes, variantMap } = MOCK_PRODUCT_OPTIONS;

    // Initialize selected sizes. We default to 'blue' 'M' as it is in stock.
    const [selectedColor, setSelectedColor] = useState<string>(colors[1].id);
    const [selectedSize, setSelectedSize] = useState<string | null>('M');

    // Check if a color is completely out of stock in ALL sizes
    const isColorAvailable = (colorId: string) => {
        return sizes.some(size => variantMap[`${colorId}_${size}`] === true);
    };

    // Check if a specific size is available for the currently selected color
    const isSizeAvailableForColor = (colorId: string, size: string) => {
        return variantMap[`${colorId}_${size}`] === true;
    };

    const handleColorSelect = (colorId: string) => {
        // Do not allow selecting completely out of stock colors
        if (!isColorAvailable(colorId)) return;

        setSelectedColor(colorId);

        // Automatically adjust size if the current size is unavailable in the new color
        if (selectedSize && !isSizeAvailableForColor(colorId, selectedSize)) {
            const firstAvailableSize = sizes.find(s => isSizeAvailableForColor(colorId, s));
            setSelectedSize(firstAvailableSize || null);
        }
    };

    const currentColorObj = colors.find(c => c.id === selectedColor);

    return (
        <div className="w-full max-w-2xl bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">

            {/* Dynamic Image Preview (Optional context to show the image changing) */}
            <div className="mb-8 p-4 bg-slate-50 rounded-xl flex items-center justify-center aspect-[16/9] overflow-hidden">
                {currentColorObj ? (
                    <img
                        src={currentColorObj.image}
                        alt={currentColorObj.name}
                        className="h-full object-contain mix-blend-multiply"
                    />
                ) : null}
            </div>

            <div className="space-y-8">

                {/* Colors Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                            Rang (Color)
                        </h3>
                        {currentColorObj && (
                            <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-md">
                                {currentColorObj.name}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {colors.map(color => {
                            const available = isColorAvailable(color.id);
                            const isSelected = selectedColor === color.id;

                            return (
                                <button
                                    key={color.id}
                                    onClick={() => handleColorSelect(color.id)}
                                    disabled={!available}
                                    aria-label={`Select ${color.name}`}
                                    className={cn(
                                        "relative w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-white focus:outline-none",
                                        isSelected
                                            ? "ring-2 ring-offset-2 ring-blue-600 scale-105"
                                            : "border border-slate-200 hover:border-slate-300 hover:scale-[1.02]",
                                        !available && "opacity-40 grayscale-[80%] cursor-not-allowed hover:border-slate-200 hover:scale-100 ring-0"
                                    )}
                                >
                                    {/* The actual swatch color block */}
                                    <div
                                        className="w-full h-full rounded-[10px] border border-black/5"
                                        style={{ backgroundColor: color.colorCode }}
                                    />

                                    {/* Selected checkmark */}
                                    {isSelected && (
                                        <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-200">
                                            <Check
                                                className={cn("w-5 h-5", color.colorCode === '#ffffff' ? "text-slate-900" : "text-white")}
                                                strokeWidth={4}
                                            />
                                        </div>
                                    )}

                                    {/* Diagonal strike-through for out of stock colors */}
                                    {!available && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-[140%] h-[2.5px] bg-slate-500 rotate-45 rounded-full" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sizes Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                            O'lcham (Size)
                        </h3>
                        {selectedSize && (
                            <span className="text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-md">
                                Tanlangan: {selectedSize}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {sizes.map(size => {
                            const available = isSizeAvailableForColor(selectedColor, size);
                            const isSelected = selectedSize === size;

                            return (
                                <button
                                    key={size}
                                    onClick={() => available && setSelectedSize(size)}
                                    disabled={!available}
                                    className={cn(
                                        "min-w-[3.5rem] h-12 px-4 rounded-xl text-base font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-100 flex items-center justify-center",
                                        isSelected
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border-transparent"
                                            : "bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50",
                                        !available && "opacity-40 bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed hover:bg-slate-50 hover:text-slate-400 hover:border-slate-200"
                                    )}
                                >
                                    {size}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
    );
}
