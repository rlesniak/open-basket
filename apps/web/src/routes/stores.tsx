import { IconArrowLeft } from "@tabler/icons-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { createStore, updateCategoryOrder } from "@/entities/store/api";
import {
  storesQueryOptions,
  storeWithCategoriesQueryOptions,
} from "@/entities/store/queries";
import { CategoryOrderEditor } from "@/features/store-management/category-order-editor";
import { CreateStoreForm } from "@/features/store-management/create-store-form";
import { StoreList } from "@/features/store-management/store-list";

const storesSearchSchema = z.object({
  selectedStoreId: z.string().optional(),
});

export const Route = createFileRoute("/stores")({
  validateSearch: storesSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const stores = await context.queryClient.ensureQueryData(
      storesQueryOptions()
    );
    const activeStoreId =
      stores.find((store) => store.id === search.selectedStoreId)?.id ??
      stores[0]?.id;

    if (activeStoreId && search.selectedStoreId !== activeStoreId) {
      throw redirect({
        to: "/stores",
        replace: true,
        search: {
          ...search,
          selectedStoreId: activeStoreId,
        },
      });
    }
  },
  component: StoresComponent,
});

function StoresComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate({ from: Route.fullPath });
  const { selectedStoreId } = Route.useSearch();
  const { data: stores } = useSuspenseQuery(storesQueryOptions());
  const { data: selectedStore, isLoading: isLoadingStore } = useQuery(
    storeWithCategoriesQueryOptions(selectedStoreId ?? "")
  );

  const createStoreMutation = useMutation({
    mutationFn: (name: string) => createStore({ data: name }),
    onSuccess: (store) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });

      navigate({
        replace: true,
        search: (prev) => ({
          ...prev,
          selectedStoreId: store.id,
        }),
      });
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
    navigate({
      search: (prev) => ({
        ...prev,
        selectedStoreId: storeId,
      }),
    });
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
        <Link search={{ selectedStoreId: selectedStoreId ?? undefined }} to="/">
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
            selectedStoreId={selectedStoreId ?? null}
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
