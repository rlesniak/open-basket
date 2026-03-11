import { IconArrowLeft } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createStore, updateCategoryOrder } from "@/entities/store/api";
import {
  storesQueryOptions,
  storeWithCategoriesQueryOptions,
} from "@/entities/store/queries";
import { CategoryOrderEditor } from "@/features/store-management/category-order-editor";
import { CreateStoreForm } from "@/features/store-management/create-store-form";
import { StoreList } from "@/features/store-management/store-list";

export const Route = createFileRoute("/stores")({
  component: StoresComponent,
});

function StoresComponent() {
  const queryClient = useQueryClient();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const { data: stores } = useQuery(storesQueryOptions());
  const { data: selectedStore, isLoading: isLoadingStore } = useQuery(
    storeWithCategoriesQueryOptions(selectedStoreId ?? "")
  );

  const createStoreMutation = useMutation({
    mutationFn: (name: string) => createStore({ data: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: (data: {
      storeId: string;
      categoryId: string;
      position: number;
    }) => updateCategoryOrder({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stores", selectedStoreId, "categories"],
      });
    },
  });

  const handleCreateStore = (name: string) => {
    createStoreMutation.mutate(name);
  };

  const handleSelectStore = (storeId: string) => {
    setSelectedStoreId(storeId);
  };

  const handleMoveUp = (categoryId: string, currentPosition: number) => {
    if (!selectedStoreId) {
      return;
    }
    updateOrderMutation.mutate({
      storeId: selectedStoreId,
      categoryId,
      position: currentPosition - 1,
    });
  };

  const handleMoveDown = (categoryId: string, currentPosition: number) => {
    if (!selectedStoreId) {
      return;
    }
    updateOrderMutation.mutate({
      storeId: selectedStoreId,
      categoryId,
      position: currentPosition + 1,
    });
  };

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/">
          <Button size="icon" variant="ghost">
            <IconArrowLeft />
          </Button>
        </Link>
        <h1 className="font-bold text-2xl">Stores Management</h1>
      </div>

      <div className="mb-8">
        <CreateStoreForm
          isPending={createStoreMutation.isPending}
          onSubmit={handleCreateStore}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-semibold text-lg">Your Stores</h2>
          <StoreList
            onSelectStore={handleSelectStore}
            selectedStoreId={selectedStoreId}
            stores={stores ?? []}
          />
        </div>

        <div>
          {selectedStore && (
            <>
              <h2 className="mb-4 font-semibold text-lg">Category Order</h2>
              <CategoryOrderEditor
                isPending={updateOrderMutation.isPending}
                onMoveDown={handleMoveDown}
                onMoveUp={handleMoveUp}
                store={selectedStore}
              />
            </>
          )}
          {!(selectedStore || isLoadingStore) && (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">
                Select a store to manage category order
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
