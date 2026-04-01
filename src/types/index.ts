export interface ProductSpec {
    label: string;
    value: string;
}

export interface ProductImage {
    id: string;
    url: string;
    altText?: string;
    isPrimary: boolean;
}

export interface Category {
    id: string;
    parentId: string | null;
    nameUz: string;
    slug: string;
    isActive: boolean;
    children: Category[];
}

// ── Variant Types ──────────────────────────────────────────
export interface ProductVariantColor {
    name: string;   // e.g. "Oq", "Qora", "Ko'k"
    hex: string;    // e.g. "#FFFFFF", "#000000"
}

export interface ProductVariantSize {
    label: string;  // e.g. "S", "M", "L", "42", "128GB"
    value: string;
}

export interface SelectedVariants {
    color?: ProductVariantColor | null;
    size?: ProductVariantSize | null;
}

export interface Product {
    id: string;

    // New Backend Fields
    nameUz: string;
    basePrice: number;
    images: ProductImage[];
    primaryImageUrl?: string | null;
    descriptionUz?: string;
    unit?: string;
    sku?: string;
    stock?: string;

    // Variant fields
    colors?: ProductVariantColor[];
    sizes?: ProductVariantSize[];

    // Existing / Optional fields
    name?: string;
    brand?: string;
    price?: string;
    priceValue?: number;
    category?: string;
    variants?: string;
    status?: "Omborda bor" | "Bestseller" | "Sanoqli qoldi" | string;
    isNew?: boolean;
    image?: string;
    description?: string;
    specs?: ProductSpec[];
}

export interface CartItem {
    id: string; // The backend cart item ID (used for DELETE and PATCH)
    productId: string;
    productNameUz: string;
    quantity: number;
    unitPrice?: number;
    basePrice?: number;
    primaryImageUrl?: string | null;
}

export interface WishlistItem {
    id: string;                // wishlist record ID — do NOT use for product logic
    productId: string;         // actual product UUID — use for delete/view actions
    productNameUz: string;
    productNameRu: string;
    slug: string;
    basePrice: number;
    primaryImageUrl: string | null;
}
