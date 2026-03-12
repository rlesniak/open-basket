import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { categoriesQueryOptions } from "@/entities/category/queries";
import type { ShoppingItemWithCategory } from "@/entities/shopping-item/model";
import {
  shoppingItemsQueryOptions,
  useDeleteShoppingItem,
  useUpdateShoppingItem,
} from "@/entities/shopping-item/queries";
import {
  storesQueryOptions,
  storeWithCategoriesQueryOptions,
} from "@/entities/store/queries";
import { AddItemInput } from "@/features/add-item/add-item-input";
import { ItemList } from "@/features/item-list/item-list";
import { StoreSelector } from "@/features/store-selector/store-selector";

const indexSearchSchema = z.object({
  selectedStoreId: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: indexSearchSchema,
  component: HomeComponent,
  beforeLoad: async ({ context, search }) => {
    const stores = await context.queryClient.ensureQueryData(
      storesQueryOptions()
    );
    await context.queryClient.ensureQueryData(shoppingItemsQueryOptions());
    await context.queryClient.ensureQueryData(categoriesQueryOptions());

    const activeStoreId =
      stores.find((store) => store.id === search.selectedStoreId)?.id ??
      stores[0]?.id;

    await context.queryClient.ensureQueryData(
      storeWithCategoriesQueryOptions(activeStoreId ?? "")
    );

    if (activeStoreId && search.selectedStoreId !== activeStoreId) {
      throw redirect({
        to: "/",
        replace: true,
        search: {
          ...search,
          selectedStoreId: activeStoreId,
        },
      });
    }
  },
});

function HomeComponent() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { selectedStoreId } = Route.useSearch();
  const { data: stores } = useSuspenseQuery(storesQueryOptions());
  const { data: storeWithCategories } = useSuspenseQuery(
    storeWithCategoriesQueryOptions(selectedStoreId ?? "")
  );
  const { data: items } = useSuspenseQuery(shoppingItemsQueryOptions());

  const updateItemMutation = useUpdateShoppingItem();
  const deleteItemMutation = useDeleteShoppingItem();

  const handleStoreChange = (storeId: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        selectedStoreId: storeId,
      }),
    });
  };

  const handleToggleStatus = (id: string, status: "pending" | "purchased") => {
    updateItemMutation.mutate({
      id,
      input: { status },
    });
  };

  const handleEdit = (item: ShoppingItemWithCategory) => {
    // TODO: Implement edit modal
    console.log("Edit item:", item);
  };

  const handleDelete = (id: string) => {
    deleteItemMutation.mutate(id);
  };

  // Map store categories to CategoryWithPosition format
  const storeCategories =
    storeWithCategories?.categories.map((cat) => ({
      ...cat.category,
      position: cat.position,
    })) ?? [];

  // Transform items from API format
  const shoppingItems: ShoppingItemWithCategory[] =
    items?.map((item) => ({
      ...item.item,
      category: item.category,
    })) ?? [];

  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto]">
      <div className="border-b p-4">
        <StoreSelector
          onStoreChange={handleStoreChange}
          selectedStoreId={selectedStoreId ?? null}
          stores={stores ?? []}
        />
      </div>

      <div className="overflow-auto p-4">
        <ItemList
          categories={storeCategories}
          items={shoppingItems}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <AddItemInput />
    </div>
  );
}
