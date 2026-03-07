import { useMemo } from 'react';
import { View, ScrollView, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Store, Product } from '@/types/shopping';
import { STORE_COLORS } from '@/utils/shopping/constants';

interface StoreSelectorProps {
  stores: Store[];
  products: Product[];
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
  isLoading: boolean;
}

export const StoreSelector = ({ stores, products, selectedStoreId, onSelectStore, isLoading }: StoreSelectorProps) => {
  const handleSelectStore = (storeId: string) => {
    onSelectStore(storeId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const storeData = useMemo(() => {
    // Calculate product counts for all stores
    const counts = new Map<string, number>();
    stores.forEach((store) => {
      counts.set(
        store.id,
        products.filter((p) => p.assignedStoreId === store.id && !p.isPurchased).length
      );
    });

    // Sort: exceptional stores with products first (by count desc), then rest in original order
    const sorted = [...stores].sort((a, b) => {
      const countA = counts.get(a.id) ?? 0;
      const countB = counts.get(b.id) ?? 0;
      const isExceptionalA = !!a.keywords;
      const isExceptionalB = !!b.keywords;
      
      // Exceptional stores with products come first, sorted by count desc
      if (isExceptionalA && countA > 0 && !(isExceptionalB && countB > 0)) return -1;
      if (isExceptionalB && countB > 0 && !(isExceptionalA && countA > 0)) return 1;
      if (isExceptionalA && countA > 0 && isExceptionalB && countB > 0) return countB - countA;
      
      // Rest keeps original order (by orderIndex or stable sort)
      return 0;
    });

    return { sorted, counts };
  }, [stores, products]);

  const { sorted: sortedStores, counts: productCounts } = storeData;

  return (
    <View className="px-4 pb-2">
      <Text className="text-sm text-gray-600 mb-2">Wybierz sklep:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        {isLoading ? (
          <Text className="text-gray-500">Ładowanie sklepów...</Text>
        ) : (
          sortedStores.map((store) => {
            const productCount = productCounts.get(store.id) ?? 0;
            const isExceptional = !!store.keywords;
            
            return (
              <Pressable
                key={store.id}
                onPress={() => handleSelectStore(store.id)}
                className={`mr-2 px-4 py-2 rounded-full border-2 flex-row items-center ${
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
                {isExceptional && productCount > 0 && (
                  <View className={`ml-2 px-2 py-0.5 rounded-full ${
                    selectedStoreId === store.id ? 'bg-white/30' : 'bg-gray-200'
                  }`}>
                    <Text className={`text-xs font-semibold ${
                      selectedStoreId === store.id ? 'text-white' : 'text-gray-600'
                    }`}>
                      {productCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};
