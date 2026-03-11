import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

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

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const { data: stores, isLoading: isLoadingStores } = useQuery(
    storesQueryOptions()
  );
  const { data: storeWithCategories } = useQuery(
    storeWithCategoriesQueryOptions(selectedStoreId ?? "")
  );
  const { data: items } = useQuery(shoppingItemsQueryOptions());

  const updateItemMutation = useUpdateShoppingItem();
  const deleteItemMutation = useDeleteShoppingItem();

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
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
          isLoading={isLoadingStores}
          onStoreChange={handleStoreChange}
          selectedStoreId={selectedStoreId}
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
