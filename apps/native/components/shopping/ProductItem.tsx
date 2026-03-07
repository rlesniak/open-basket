import { View, Pressable, Text } from 'react-native';
import { Product } from '@/types/shopping';

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
      className={`mx-4 mb-3 ${!isLast ? '' : ''}`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View 
        className={`flex-row items-center p-4 rounded-2xl ${
          isPurchased ? 'bg-gray-50' : 'bg-white'
        }`}
      >
        {/* Checkbox */}
        <View 
          className={`w-7 h-7 rounded-xl mr-4 items-center justify-center ${
            isPurchased 
              ? 'bg-green-500' 
              : 'border-2 border-gray-200 bg-gray-50'
          }`}
        >
          {isPurchased ? (
            <Text className="text-white text-sm font-bold">✓</Text>
          ) : isPending ? (
            <View className="w-3 h-3 bg-blue-500 rounded-lg" />
          ) : null}
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Product Name */}
          <Text 
            className={`text-base font-semibold ${
              isPurchased ? 'text-gray-400 line-through' : 'text-gray-900'
            }`}
          >
            {product.name}
          </Text>
          
          {/* Quantity & Note Row */}
          {(product.qty !== null || product.note) && (
            <View className="flex-row items-center mt-1">
              {product.qty !== null && (
                <View className="bg-blue-50 px-2 py-0.5 rounded-lg mr-2">
                  <Text className="text-blue-600 text-xs font-medium">
                    {product.qty} {product.unit || 'szt'}
                  </Text>
                </View>
              )}
              {product.note && (
                <Text className={`text-xs ${isPurchased ? 'text-gray-300' : 'text-gray-500'}`}>
                  {product.note}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};
