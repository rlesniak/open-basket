import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { client } from '@/utils/orpc';

export const useStores = () => {
  return useQuery({
    queryKey: ['shopping', 'getStores'],
    queryFn: () => client.shopping.getStores(),
  });
};

export const useCreateExceptionStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; keywords: string }) =>
      client.shopping.createExceptionStore(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping', 'getStores'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });
};

export const useDeleteExceptionStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { storeId: string }) =>
      client.shopping.deleteExceptionStore(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping', 'getStores'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['shopping', 'getCategories'],
    queryFn: () => client.shopping.getCategories(),
  });
};

export const useProducts = () => {
  return useQuery({
    queryKey: ['shopping', 'getProducts'],
    queryFn: () => client.shopping.getProducts(),
  });
};

export const useStoreCategoryOrders = (storeId: string) => {
  return useQuery({
    queryKey: ['shopping', 'getStoreCategoryOrders', storeId],
    queryFn: () => client.shopping.getStoreCategoryOrders({ storeId }),
    enabled: !!storeId,
  });
};

export const useAddProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      qty: number | null;
      unit: string | null;
      note: string | null;
      categoryId: string;
      assignedStoreId: string | null; // NEW
    }) =>
      client.shopping.addProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping', 'getProducts'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });
};

export const useToggleProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { productId: string; isPurchased: boolean }) => 
      client.shopping.toggleProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping', 'getProducts'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });
};

export const useClearPurchased = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => client.shopping.clearPurchased(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping', 'getProducts'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { productId: string; name: string; qty: number | null; unit: string | null; note: string | null; categoryId: string; assignedStoreId: string | null }) =>
      client.shopping.updateProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping', 'getProducts'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });
};

export const useUpdateCategoryOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { storeId: string; categoryId: string; orderIndex: number }) =>
      client.shopping.updateCategoryOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping', 'getStoreCategoryOrders'] });
    },
  });
};

export const useFilteredProducts = (selectedStoreId: string) => {
  const { data: products = [], ...rest } = useProducts();
  const { data: stores = [] } = useStores();

  const filteredProducts = useMemo(() => {
    const selectedStore = stores.find((s) => s.id === selectedStoreId);
    const isExceptionalStore = selectedStore?.keywords !== null;

    return products.filter((product) => {
      if (isExceptionalStore) {
        // For exceptional stores: show ONLY products assigned to this store
        return product.assignedStoreId === selectedStoreId;
      } else {
        // For regular stores: show global products + products assigned to this store
        if (!product.assignedStoreId) return true;
        return product.assignedStoreId === selectedStoreId;
      }
    });
  }, [products, selectedStoreId, stores]);

  return { data: filteredProducts, ...rest };
};
