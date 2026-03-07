import { useState, useEffect } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ProductInput } from './components/ProductInput';
import { StoreSelector } from './components/StoreSelector';
import { ProductList } from './components/ProductList';
import { PurchasedSection } from './components/PurchasedSection';
import { useStores, useCategories, useProducts, useStoreCategoryOrders, useAddProduct, useToggleProduct, useClearPurchased } from './hooks/useShopping';
import { useProductParser } from './hooks/useProductParser';
import { Category } from './types/shopping';

export default function ShoppingListScreen() {
  const [productInput, setProductInput] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  const { data: stores = [], isLoading: storesLoading } = useStores();
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: storeCategoryOrders = [] } = useStoreCategoryOrders(selectedStoreId);
  
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

    const category = categories.find(
      (c: Category) => c.name.toLowerCase() === parsed.category.toLowerCase()
    );

    if (!category) {
      console.error('Category not found:', parsed.category);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    await addProductMutation.mutateAsync({
      name: parsed.name,
      qty: parsed.qty,
      unit: parsed.unit,
      note: parsed.note,
      categoryId: category.id,
    });

    setProductInput('');
  };

  const handleToggleProduct = (productId: string, isPurchased: boolean) => {
    toggleProductMutation.mutate({ productId, isPurchased });
  };

  const handleClearPurchased = () => {
    clearPurchasedMutation.mutate();
  };

  const pendingProducts = products.filter((p) => !p.isPurchased);
  const purchasedProducts = products.filter((p) => p.isPurchased);

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Lista zakupów' }} />

      <ProductInput
        value={productInput}
        onChangeText={setProductInput}
        onSubmit={handleAddProduct}
        isLoading={isParsing || addProductMutation.isPending}
      />

      <StoreSelector
        stores={stores}
        selectedStoreId={selectedStoreId}
        onSelectStore={setSelectedStoreId}
        isLoading={storesLoading}
      />

      <ScrollView className="flex-1 px-4">
        {productsLoading ? (
          <Text className="text-center text-gray-500 mt-8">Ładowanie produktów...</Text>
        ) : pendingProducts.length === 0 && purchasedProducts.length === 0 ? (
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
              togglePending={toggleProductMutation.isPending}
              pendingProductId={toggleProductMutation.variables?.productId}
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
