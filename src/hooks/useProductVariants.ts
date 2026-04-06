import { useQuery } from "@tanstack/react-query";
import { getProductTypes } from "@/services/api";
import { ProductType } from "../types";

export function useProductVariants(productId: string | number) {
    return useQuery<ProductType[]>({
        queryKey: ["product-variants", productId],
        queryFn: () => getProductTypes(productId),
        enabled: !!productId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
