import { View, Pressable, Text } from 'react-native';
import { Card, Spinner } from 'heroui-native';
import { Product } from '../types/shopping';
import { formatProductText } from '../utils/formatters';

interface ProductItemProps {
  product: Product;
  onToggle: () => void;
  isPending: boolean;
  isLast: boolean;
  isPurchased?: boolean;
}

export const ProductItem = ({ 
  product, 
  onToggle, 
  isPending, 
  isLast,
  isPurchased = false 
}: ProductItemProps) => {
  return (
    <Pressable
      onPress={onToggle}
      className={`flex-row items-center py-3 px-2 ${
        !isLast ? 'border-b border-gray-100' : ''
      }`}
    >
      <View 
        className={`w-6 h-6 rounded mr-3 items-center justify-center ${
          isPurchased 
            ? 'bg-green-500' 
            : 'border-2 border-gray-300'
        }`}
      >
        {isPurchased ? (
          <Text className="text-white text-xs">✓</Text>
        ) : isPending ? (
          <View className="w-3 h-3 bg-blue-500 rounded-sm" />
        ) : null}
      </View>
      <Text className={`flex-1 ${isPurchased ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
        {formatProductText(product)}
      </Text>
    </Pressable>
  );
};
