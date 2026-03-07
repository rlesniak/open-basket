import { useState } from 'react';
import { View, ScrollView, Pressable, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Card, Input, Spinner } from 'heroui-native';
import { client } from '@/utils/orpc';
import { env } from '@listonic/env/native';

type Store = {
  id: string;
  name: string;
  orderIndex: number;
};

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  qty: number | null;
  unit: string | null;
  note: string | null;
  categoryId: string;
  isPurchased: boolean;
  createdAt: number;
};

type StoreCategoryOrder = {
  categoryId: string;
  orderIndex: number;
};

type ParsedProduct = {
  name: string;
  qty: number | null;
  unit: string | null;
  note: string | null;
  category: string;
};

const STORE_COLORS: Record<string, string> = {
  'Biedronka': 'bg-red-500',
  'Lidl': 'bg-yellow-500',
  'Kaufland': 'bg-red-600',
  'Auchan': 'bg-orange-500',
};

export default function ShoppingListScreen() {
  const [productInput, setProductInput] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch stores
  const storesQuery = useQuery({
    queryKey: ['shopping', 'getStores'],
    queryFn: () => client.shopping.getStores(),
  });
  const stores = storesQuery.data || [];
  const storesLoading = storesQuery.isLoading;

  // Fetch categories
  const categoriesQuery = useQuery({
    queryKey: ['shopping', 'getCategories'],
    queryFn: () => client.shopping.getCategories(),
  });
  const categories = categoriesQuery.data || [];

  // Fetch products
  const productsQuery = useQuery({
    queryKey: ['shopping', 'getProducts'],
    queryFn: () => client.shopping.getProducts(),
  });
  const products = productsQuery.data || [];
  const productsLoading = productsQuery.isLoading;

  // Fetch store category orders
  const storeCategoryOrdersQuery = useQuery({
    queryKey: ['shopping', 'getStoreCategoryOrders', selectedStoreId],
    queryFn: () => client.shopping.getStoreCategoryOrders({ storeId: selectedStoreId }),
    enabled: !!selectedStoreId,
  });
  const storeCategoryOrders = storeCategoryOrdersQuery.data || [];

  // Set default store when stores load
  if (stores.length > 0 && !selectedStoreId) {
    setSelectedStoreId(stores[0].id);
  }

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: (data: { name: string; qty: number | null; unit: string | null; note: string | null; categoryId: string }) => 
      client.shopping.addProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping', 'getProducts'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  // Toggle product mutation
  const toggleProductMutation = useMutation({
    mutationFn: (data: { productId: string; isPurchased: boolean }) => 
      client.shopping.toggleProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping', 'getProducts'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  // Clear purchased mutation
  const clearPurchasedMutation = useMutation({
    mutationFn: () => client.shopping.clearPurchased(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping', 'getProducts'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  // Parse product input using AI
  const parseProductInput = async (input: string): Promise<ParsedProduct | null> => {
    try {
      const response = await fetch(`${env.EXPO_PUBLIC_SERVER_URL}/shopping/parse-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  };

  // Handle add product
  const handleAddProduct = async () => {
    if (!productInput.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const parsed = await parseProductInput(productInput);
    if (!parsed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Find category by name
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

  // Handle toggle product
  const handleToggleProduct = (productId: string, isPurchased: boolean) => {
    toggleProductMutation.mutate({ productId, isPurchased });
  };

  // Handle clear purchased
  const handleClearPurchased = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    clearPurchasedMutation.mutate();
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c: Category) => c.id === categoryId);
    return category?.name || 'Inne';
  };

  // Get category order for selected store
  const getCategoryOrder = (categoryId: string): number => {
    const order = storeCategoryOrders.find(
      (o: StoreCategoryOrder) => o.categoryId === categoryId
    );
    return order?.orderIndex || 999;
  };

  // Group products by category
  const groupProductsByCategory = (products: Product[]) => {
    const grouped: Record<string, Product[]> = {};
    
    products.forEach((product) => {
      if (!grouped[product.categoryId]) {
        grouped[product.categoryId] = [];
      }
      grouped[product.categoryId].push(product);
    });

    return grouped;
  };

  // Separate pending and purchased products
  const pendingProducts = products.filter((p: Product) => !p.isPurchased);
  const purchasedProducts = products.filter((p: Product) => p.isPurchased);

  const groupedProducts = groupProductsByCategory(pendingProducts);
  
  // Sort categories by store order
  const sortedCategoryIds = Object.keys(groupedProducts).sort((a, b) => {
    const orderA = getCategoryOrder(a);
    const orderB = getCategoryOrder(b);
    return orderA - orderB;
  });

  // Format product display text
  const formatProductText = (product: Product): string => {
    let text = product.name;
    if (product.qty !== null && product.unit) {
      text += ` (${product.qty} ${product.unit})`;
    } else if (product.qty !== null) {
      text += ` (${product.qty})`;
    }
    if (product.note) {
      text += ` - ${product.note}`;
    }
    return text;
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Lista zakupów' }} />

      {/* Input Section */}
      <Card className="m-4 p-4">
        <View className="flex-row gap-2">
          <Input
            value={productInput}
            onChangeText={setProductInput}
            placeholder="np. mleko 10 sztuk, 3.2%"
            className="flex-1"
            onSubmitEditing={handleAddProduct}
          />
          <Pressable
            onPress={handleAddProduct}
            disabled={!productInput.trim() || addProductMutation.isPending}
            className={`px-4 py-2 rounded-lg flex-row items-center ${
              !productInput.trim() || addProductMutation.isPending
                ? 'bg-gray-300'
                : 'bg-blue-500'
            }`}
          >
            {addProductMutation.isPending ? (
              <Spinner size="sm" />
            ) : (
              <Text className="text-white font-medium">Dodaj</Text>
            )}
          </Pressable>
        </View>
      </Card>

      {/* Store Selector */}
      <View className="px-4 pb-2">
        <Text className="text-sm text-gray-600 mb-2">Wybierz sklep:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {storesLoading ? (
            <Text className="text-gray-500">Ładowanie sklepów...</Text>
          ) : (
            stores.map((store: Store) => (
              <Pressable
                key={store.id}
                onPress={() => {
                  setSelectedStoreId(store.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className={`mr-2 px-4 py-2 rounded-full border-2 ${
                  selectedStoreId === store.id
                    ? `${STORE_COLORS[store.name] || 'bg-blue-500'} border-transparent`
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedStoreId === store.id ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {store.name}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>

      {/* Product List */}
      <ScrollView className="flex-1 px-4">
        {productsLoading ? (
          <Text className="text-center text-gray-500 mt-8">Ładowanie produktów...</Text>
        ) : pendingProducts.length === 0 && purchasedProducts.length === 0 ? (
          <Text className="text-center text-gray-500 mt-8">
            Brak produktów na liście. Dodaj coś!
          </Text>
        ) : (
          <>
            {/* Pending Products Grouped by Category */}
            {sortedCategoryIds.map((categoryId) => {
              const categoryProducts = groupedProducts[categoryId];
              const categoryName = getCategoryName(categoryId);

              return (
                <View key={categoryId} className="mb-4">
                  <Text className="text-lg font-bold text-gray-800 mb-2 px-1">
                    {categoryName}
                  </Text>
                  <Card className="p-2">
                    {categoryProducts.map((product, index) => (
                      <Pressable
                        key={product.id}
                        onPress={() => handleToggleProduct(product.id, true)}
                        className={`flex-row items-center py-3 px-2 ${
                          index !== categoryProducts.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <View className="w-6 h-6 rounded border-2 border-gray-300 mr-3 items-center justify-center">
                          {toggleProductMutation.isPending && 
                           toggleProductMutation.variables?.productId === product.id ? (
                            <View className="w-3 h-3 bg-blue-500 rounded-sm" />
                          ) : null}
                        </View>
                        <Text className="flex-1 text-gray-800">
                          {formatProductText(product)}
                        </Text>
                      </Pressable>
                    ))}
                  </Card>
                </View>
              );
            })}

            {/* Purchased Section */}
            {purchasedProducts.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2 px-1">
                  <Text className="text-lg font-bold text-gray-500">Kupione</Text>
                  <Pressable
                    onPress={handleClearPurchased}
                    disabled={clearPurchasedMutation.isPending}
                    className="px-3 py-1 rounded bg-red-100"
                  >
                    {clearPurchasedMutation.isPending ? (
                      <Spinner size="sm" />
                    ) : (
                      <Text className="text-red-600 text-sm font-medium">Wyczyść</Text>
                    )}
                  </Pressable>
                </View>
                <Card className="p-2 bg-gray-100">
                  {purchasedProducts.map((product, index) => (
                    <Pressable
                      key={product.id}
                      onPress={() => handleToggleProduct(product.id, false)}
                      className={`flex-row items-center py-3 px-2 ${
                        index !== purchasedProducts.length - 1 ? 'border-b border-gray-200' : ''
                      }`}
                    >
                      <View className="w-6 h-6 rounded bg-green-500 mr-3 items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                      <Text className="flex-1 text-gray-500 line-through">
                        {formatProductText(product)}
                      </Text>
                    </Pressable>
                  ))}
                </Card>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
