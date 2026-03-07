import { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Text } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from 'heroui-native';
import * as Haptics from 'expo-haptics';
import {
  useCategories,
  useStoreCategoryOrders,
  useUpdateCategoryOrder,
} from '@/hooks/shopping/useShopping';
import { getCategoryEmoji } from '@/shared/constants/category-emojis';

export default function StoreOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  const { data: allCategories } = useCategories();
  const { data: orders } = useStoreCategoryOrders(id);
  const updateOrder = useUpdateCategoryOrder();

  useEffect(() => {
    if (allCategories && orders) {
      const sorted = [...allCategories].sort((a, b) => {
        const orderA = orders.find((o) => o.categoryId === a.id)?.orderIndex ?? 999;
        const orderB = orders.find((o) => o.categoryId === b.id)?.orderIndex ?? 999;
        return orderA - orderB;
      });
      setCategories(sorted);
    }
  }, [allCategories, orders]);

  const moveCategory = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[newIndex];
    newCategories[newIndex] = temp;

    setCategories(newCategories);

    // Update all orders in database
    for (let i = 0; i < newCategories.length; i++) {
      await updateOrder.mutateAsync({
        storeId: id,
        categoryId: newCategories[i].id,
        orderIndex: i,
      });
    }

    queryClient.invalidateQueries({
      queryKey: ['shopping', 'getStoreCategoryOrders'],
    });
  };

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Stack.Screen options={{ title: 'Kolejność kategorii' }} />
      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 20 }}>
        <Text className="text-xs text-gray-500 mb-4">
          Użyj strzałek, aby zmienić kolejność kategorii zgodnie z układem sklepu
        </Text>

        {categories.map((category, index) => (
          <Card key={category.id} className="mb-2">
            <Card.Body className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Text className="text-gray-400 w-8">{index + 1}</Text>
                <Text className="text-xl mr-2">{getCategoryEmoji(category.id)}</Text>
                <Text className="text-lg">{category.name}</Text>
              </View>

              <View className="flex-row">
                <Pressable
                  onPress={() => moveCategory(index, -1)}
                  disabled={index === 0}
                  className={`p-2 ${index === 0 ? 'opacity-30' : ''}`}
                >
                  <Text className="text-blue-500 text-xl">↑</Text>
                </Pressable>
                <Pressable
                  onPress={() => moveCategory(index, 1)}
                  disabled={index === categories.length - 1}
                  className={`p-2 ${index === categories.length - 1 ? 'opacity-30' : ''}`}
                >
                  <Text className="text-blue-500 text-xl">↓</Text>
                </Pressable>
              </View>
            </Card.Body>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
