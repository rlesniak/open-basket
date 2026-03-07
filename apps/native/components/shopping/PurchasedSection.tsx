import { View, Pressable, Text, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Product } from '@/types/shopping';
import { ProductItem } from '@/components/shopping/ProductItem';

interface PurchasedSectionProps {
  products: Product[];
  onToggleProduct: (productId: string, isPurchased: boolean) => void;
  onClearPurchased: () => void;
  isClearing: boolean;
}

export const PurchasedSection = ({
  products,
  onToggleProduct,
  onClearPurchased,
  isClearing,
}: PurchasedSectionProps) => {
  if (products.length === 0) {
    return null;
  }

  const handleClear = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onClearPurchased();
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3 px-4">
        <View className="flex-row items-center">
          <View className="w-1 h-5 bg-green-500 rounded-full mr-2" />
          <Text className="text-lg font-bold text-gray-500">Kupione</Text>
          <Text className="text-sm text-gray-400 ml-2">
            ({products.length})
          </Text>
        </View>
        <Pressable
          onPress={handleClear}
          disabled={isClearing}
          className="px-4 py-2 rounded-xl bg-red-50"
        >
          {isClearing ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Text className="text-red-500 text-sm font-semibold">Wyczyść</Text>
          )}
        </Pressable>
      </View>
      <View>
        {products.map((product, index) => (
          <ProductItem
            key={product.id}
            product={product}
            onToggle={() => onToggleProduct(product.id, false)}
            isPending={false}
            isLast={index === products.length - 1}
            isPurchased
          />
        ))}
      </View>
    </View>
  );
};
