import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createShoppingItem,
  deleteShoppingItem,
  getShoppingItems,
  updateShoppingItem,
} from "./api";
import type { CreateShoppingItemInput, UpdateShoppingItemInput } from "./model";

export const shoppingItemsQueryOptions = () =>
  queryOptions({
    queryKey: ["shopping-items"],
    queryFn: () => getShoppingItems(),
  });

export function useCreateShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateShoppingItemInput) =>
      createShoppingItem({ data: input } as unknown as Parameters<
        typeof createShoppingItem
      >[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
    },
  });
}

export function useUpdateShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; input: UpdateShoppingItemInput }) =>
      updateShoppingItem({ data } as unknown as Parameters<
        typeof updateShoppingItem
      >[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
    },
  });
}

export function useDeleteShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteShoppingItem({ data: id } as unknown as Parameters<
        typeof deleteShoppingItem
      >[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
    },
  });
}
