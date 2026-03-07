import { useState, useEffect } from 'react';
import { View, ScrollView, Text, Pressable, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ProductInput } from '@/components/shopping/ProductInput';
import { StoreSelector } from '@/components/shopping/StoreSelector';
import { ProductList } from '@/components/shopping/ProductList';
import { PurchasedSection } from '@/components/shopping/PurchasedSection';
import { useStores, useCategories, useProducts, useFilteredProducts, useStoreCategoryOrders, useAddProduct, useToggleProduct, useClearPurchased } from '@/hooks/shopping/useShopping';
import { useProductParser } from '@/hooks/shopping/useProductParser';

export default function ShoppingListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [productInput, setProductInput] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  const { data: stores = [], isLoading: storesLoading } = useStores();
  const { data: categories = [] } = useCategories();
  // All products for store selector (to count products in each store)
  const { data: allProducts = [] } = useProducts();
  // Filtered products based on selected store for display
  const { data: products = [] } = useFilteredProducts(selectedStoreId);
  const { data: storeCategoryOrders = [], isLoading: categoryOrdersLoading } = useStoreCategoryOrders(selectedStoreId);
  
  const addProductMutation = useAddProduct();
  const toggleProductMutation = useToggleProduct();
  const clearPurchasedMutation = useClearPurchased();
  const { parseProduct, isParsing } = useProductParser();

  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const handleAddProduct = async () => {
    if (!productInput.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const parsed = await parseProduct(productInput);
    if (!parsed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    await addProductMutation.mutateAsync({
      name: parsed.name,
      qty: parsed.qty,
      unit: parsed.unit,
      note: parsed.note,
      categoryId: parsed.categoryId,
      assignedStoreId: parsed.assignedStoreId || null,
    });

    setProductInput('');
  };

  const handleToggleProduct = (productId: string, isPurchased: boolean) => {
    toggleProductMutation.mutate({ productId, isPurchased });
  };

  const handleClearPurchased = () => {
    clearPurchasedMutation.mutate();
  };

  const handleEditProduct = (productId: string) => {
    router.push({
      pathname: '/edit-product',
      params: { id: productId },
    });
  };

  const pendingProducts = products.filter((p) => !p.isPurchased);
  const purchasedProducts = products.filter((p) => p.isPurchased);

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <StatusBar style="dark" />
      <Stack.Screen 
        options={{ 
          title: 'Lista zakupów',
          headerRight: () => (
            <Pressable onPress={() => router.push('/settings')} className="mr-4">
              <Text className="text-blue-500 font-medium">Ustawienia</Text>
            </Pressable>
          )
        }} 
      />

      <ProductInput
        value={productInput}
        onChangeText={setProductInput}
        onSubmit={handleAddProduct}
        isLoading={isParsing || addProductMutation.isPending}
      />

      <StoreSelector
        stores={stores}
        products={allProducts}
        selectedStoreId={selectedStoreId}
        onSelectStore={setSelectedStoreId}
        isLoading={storesLoading}
      />

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20 }}>
        {pendingProducts.length === 0 && purchasedProducts.length === 0 ? (
          <Text className="text-center text-gray-500 mt-8">
            Brak produktów na liście. Dodaj coś!
          </Text>
        ) : (
          <>
            <ProductList
              products={pendingProducts}
              categories={categories}
              storeCategoryOrders={storeCategoryOrders}
              onToggleProduct={handleToggleProduct}
              onEditProduct={handleEditProduct}
              togglePending={toggleProductMutation.isPending}
              pendingProductId={toggleProductMutation.variables?.productId}
              isLoading={categoryOrdersLoading}
            />

            <PurchasedSection
              products={purchasedProducts}
              onToggleProduct={handleToggleProduct}
              onClearPurchased={handleClearPurchased}
              isClearing={clearPurchasedMutation.isPending}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
