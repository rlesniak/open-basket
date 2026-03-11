import { queryOptions } from "@tanstack/react-query";
import { getCategories } from "./api";

export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });
