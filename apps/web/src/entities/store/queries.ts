import { queryOptions } from "@tanstack/react-query";
import { getStores, getStoreWithCategories } from "./api";

export const storesQueryOptions = () =>
  queryOptions({
    queryKey: ["stores"],
    queryFn: () => getStores(),
  });

export const storeWithCategoriesQueryOptions = (storeId: string) =>
  queryOptions({
    queryKey: ["stores", storeId, "categories"],
    queryFn: () => getStoreWithCategories(),
    enabled: !!storeId,
  });
