/**
 * calculateTotal.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for all price calculations in Ortho Market.
 *
 * CRITICAL API RULE:
 *   `discountPrice` is the FINAL ADJUSTED PRICE of the item — not a discount
 *   amount to subtract. Use it directly as the unit price when it exists.
 *
 * Formula per line item:
 *   activePrice = discountPrice ?? basePrice ?? unitPrice ?? 0
 *   lineTotal   = (activePrice + variantParentPrice + variantChildPrice) * quantity
 */

import type { CartItem } from "../types";

// ─── Minimal interfaces for order-history / order-details items ────────────────

export interface OrderLineItem {
    /** The per-unit price the backend saved (may be variant extra price only). */
    unitPrice?: number | null;
    /** The final adjusted product price (IS the discounted price). */
    discountPrice?: number | null;
    /** The original (pre-discount) product price. */
    basePrice?: number | null;
    /** Quantity ordered. */
    quantity?: number | null;
    /** Whether the item has a product-type / variant selection. */
    productTypeId?: string | number | null;
    typeId?: string | number | null;
    /** Optional nested product details (may be available in history responses). */
    product?: {
        basePrice?: number | null;
        discountPrice?: number | null;
    } | null;
}

export interface OrderProductLookup {
    basePrice?: number | null;
    discountPrice?: number | null;
}

// ─── Core helpers ──────────────────────────────────────────────────────────────

/**
 * Returns the effective unit price for a product.
 *
 * Rule: `discountPrice` is the FINAL price. If present, use it as-is.
 * Otherwise fall back to `basePrice`, then `unitPrice`, then 0.
 */
export function getEffectivePrice(
    discountPrice?: number | null,
    basePrice?: number | null,
    unitPrice?: number | null
): number {
    if (discountPrice != null && discountPrice > 0) return discountPrice;
    if (basePrice != null && basePrice > 0) return basePrice;
    if (unitPrice != null && unitPrice > 0) return unitPrice;
    return 0;
}

// ─── Cart item total ───────────────────────────────────────────────────────────

/**
 * Calculates the line total for a single CartItem.
 *
 * activePrice = discountPrice (if set) OR basePrice OR unitPrice
 * lineTotal   = (activePrice + parentVariantPrice + childVariantPrice) * quantity
 */
export function calcCartItemTotal(item: CartItem): number {
    const activePrice = getEffectivePrice(item.discountPrice, item.basePrice, item.unitPrice);
    const parentExtra = item.selectedParentType?.price ?? 0;
    const childExtra = item.selectedChildType?.price ?? 0;
    const unitPrice = activePrice + parentExtra + childExtra;
    return unitPrice * (item.quantity || 0);
}

/**
 * Calculates the effective unit price (without quantity) for a CartItem.
 * Used for display purposes (e.g. price per unit in cart rows).
 */
export function calcCartItemUnitPrice(item: CartItem): number {
    const activePrice = getEffectivePrice(item.discountPrice, item.basePrice, item.unitPrice);
    const parentExtra = item.selectedParentType?.price ?? 0;
    const childExtra = item.selectedChildType?.price ?? 0;
    return activePrice + parentExtra + childExtra;
}

/**
 * Calculates the grand total for the entire cart.
 */
export function calcCartTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + calcCartItemTotal(item), 0);
}

// ─── Order history / order details item totals ─────────────────────────────────

/**
 * Calculates the full unit price for an order line item returned from the API.
 *
 * For items WITHOUT a variant: use discountPrice → basePrice → unitPrice.
 * For items WITH a variant: the backend may store only the variant's extra price
 * in `unitPrice`. In that case we add the product's effective base price
 * (looked up from `productsMap`) to the stored variant price.
 *
 * @param item        The raw order item from the API.
 * @param productsMap Optional map of productId → Product for enriched lookups.
 */
export function calcOrderItemUnitPrice(
    item: OrderLineItem,
    productsMap: Record<string, OrderProductLookup> = {}
): number {
    const hasVariant = !!(item.productTypeId || item.typeId);
    const rawPrice = item.unitPrice ?? 0;

    if (!hasVariant) {
        // No variant — use the item's own price fields directly.
        return getEffectivePrice(item.discountPrice, item.basePrice, rawPrice);
    }

    // Has variant — backend may store only variant extra price in unitPrice.
    // Enrich with the product's base price from the lookup map.
    const productId = (item as any).productId as string | undefined;
    const product = productId ? productsMap[productId] : undefined;

    if (!product) {
        // Product not yet loaded — return raw price as best guess.
        return rawPrice;
    }

    const productActivePrice = getEffectivePrice(product.discountPrice, product.basePrice);
    return rawPrice + productActivePrice;
}

/**
 * Calculates the line total for a single order item.
 */
export function calcOrderItemTotal(
    item: OrderLineItem,
    productsMap: Record<string, OrderProductLookup> = {}
): number {
    const qty = item.quantity ?? 1;
    return calcOrderItemUnitPrice(item, productsMap) * qty;
}

/**
 * Calculates the grand total for an order's items array.
 */
export function calcOrderTotal(
    items: OrderLineItem[],
    productsMap: Record<string, OrderProductLookup> = {}
): number {
    if (!Array.isArray(items) || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + calcOrderItemTotal(item, productsMap), 0);
}

// ─── Formatting helper ─────────────────────────────────────────────────────────

/**
 * Formats a numeric price value as Uzbek so'm string.
 * e.g. 3216000 → "3,216,000 so'm"
 */
export function formatSom(price: number): string {
    return `${price.toLocaleString()} so'm`;
}
