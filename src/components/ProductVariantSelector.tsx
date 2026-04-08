import React, { useState, useEffect } from 'react';
import { fetchProductTypes } from '../services/api';

export interface ProductTypeVariant {
    id: number;
    name: string;
    stock: number;
    children?: ProductTypeVariant[];
    subTypes?: ProductTypeVariant[]; // Fallback interface property
}

interface ProductVariantSelectorProps {
    productId: string | number;
    onVariantSelected: (variantId: number | null) => void;
}

export const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({
    productId,
    onVariantSelected
}) => {
    const [data, setData] = useState<ProductTypeVariant[]>([]);
    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Fetch product types based on productId
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const result = await fetchProductTypes(productId);
                setData(result);
            } catch (error) {
                console.error("Failed to fetch product types:", error);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            loadData();
        }
    }, [productId]);

    // Determine final variant selection logic
    useEffect(() => {
        if (!selectedParentId) {
            onVariantSelected(null);
            return;
        }

        const parent = data.find(p => p.id === selectedParentId);
        if (!parent) return;

        const childrenList = parent.children || parent.subTypes || [];

        if (childrenList.length > 0) {
            onVariantSelected(selectedChildId);
        } else {
            onVariantSelected(selectedParentId);
        }
    }, [selectedParentId, selectedChildId, data, onVariantSelected]);

    const handleParentSelect = (id: number) => {
        setSelectedParentId(id);
        setSelectedChildId(null); // Reset child selection when parent changes
    };

    const handleChildSelect = (id: number) => {
        setSelectedChildId(id);
    };

    if (loading) {
        return <div className="text-center text-sm text-gray-400 py-4">Yuklanmoqda...</div>;
    }

    if (!data || data.length === 0) {
        return null; // Don't render component if there's no variants data
    }

    const selectedParentData = data.find(p => p.id === selectedParentId);
    const parentChildrenList = selectedParentData ? (selectedParentData.children || selectedParentData.subTypes || []) : [];

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Parent Variants Row */}
            <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider ml-1">VARIANT TANLANG</h3>
                <div className="flex flex-row overflow-x-auto gap-3 pb-2 scrollbar-none snap-x">
                    {data.map((parent) => {
                        const isSelected = selectedParentId === parent.id;
                        return (
                            <button
                                key={parent.id}
                                onClick={() => handleParentSelect(parent.id)}
                                className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-16 rounded-2xl border transition-all duration-300 snap-center
                  ${isSelected
                                        ? 'border-[#007AFF] bg-[#F0F8FF]' // Modern Telegram iOS blue accent
                                        : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`text-sm tracking-tight ${isSelected ? 'font-bold text-[#007AFF]' : 'font-bold text-gray-900'}`}>
                                    {parent.name}
                                </span>
                                <span className={`text-xs mt-0.5 ${isSelected ? 'text-[#007AFF]/80' : 'text-gray-400'}`}>
                                    {parent.stock} DONA
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Conditional Child Variants Row */}
            {selectedParentData && parentChildrenList && parentChildrenList.length > 0 && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ease-in-out">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider ml-1 mt-1">QO'SHIMCHA VARIANT</h3>
                    <div className="flex flex-row overflow-x-auto gap-3 pb-2 scrollbar-none snap-x flex-wrap">
                        {parentChildrenList.map((child) => {
                            const isSelected = selectedChildId === child.id;
                            return (
                                <button
                                    key={child.id}
                                    onClick={() => handleChildSelect(child.id)}
                                    className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-16 rounded-2xl border transition-all duration-300 snap-center
                    ${isSelected
                                            ? 'border-[#007AFF] bg-[#F0F8FF]'
                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    <span className={`text-sm tracking-tight ${isSelected ? 'font-bold text-[#007AFF]' : 'font-bold text-gray-900'}`}>
                                        {child.name}
                                    </span>
                                    <span className={`text-xs mt-0.5 ${isSelected ? 'text-[#007AFF]/80' : 'text-gray-400'}`}>
                                        {child.stock} DONA
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
