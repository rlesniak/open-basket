import { View, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Card, Spinner } from 'heroui-native';
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
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-2 px-1">
        <Text className="text-lg font-bold text-gray-500">Kupione</Text>
        <Pressable
          onPress={handleClear}
          disabled={isClearing}
          className="px-3 py-1 rounded bg-red-100"
        >
          {isClearing ? (
            <Spinner size="sm" />
          ) : (
            <Text className="text-red-600 text-sm font-medium">Wyczyść</Text>
          )}
        </Pressable>
      </View>
      <Card className="p-2 bg-gray-100">
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
      </Card>
    </View>
  );
};
