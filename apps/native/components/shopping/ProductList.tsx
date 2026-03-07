import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { Product, Category, StoreCategoryOrder } from '@/types/shopping';
import { ProductItem } from '@/components/shopping/ProductItem';

const CATEGORY_EMOJIS: Record<string, string> = {
  'owoce': '🍎',
  'warzywa': '🥕',
  'nabial': '🥛',
  'mieso': '🥩',
  'pieczywo': '🥖',
  'napoje': '🥤',
  'chemia': '🧴',
  'slodycze': '🍬',
};

interface ProductListProps {
  products: Product[];
  categories: Category[];
  storeCategoryOrders: StoreCategoryOrder[];
  onToggleProduct: (productId: string, isPurchased: boolean) => void;
  onEditProduct?: (productId: string) => void;
  togglePending: boolean;
  pendingProductId?: string;
}

export const ProductList = ({
  products,
  categories,
  storeCategoryOrders,
  onToggleProduct,
  onEditProduct,
  togglePending,
  pendingProductId,
}: ProductListProps) => {
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      const emoji = CATEGORY_EMOJIS[c.id] || '📦';
      map[c.id] = `${emoji} ${c.name}`;
    });
    return map;
  }, [categories]);

  const orderMap = useMemo(() => {
    const map: Record<string, number> = {};
    storeCategoryOrders.forEach((o) => {
      map[o.categoryId] = o.orderIndex;
    });
    return map;
  }, [storeCategoryOrders]);

  const groupedProducts = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    products.forEach((product) => {
      if (!grouped[product.categoryId]) {
        grouped[product.categoryId] = [];
      }
      grouped[product.categoryId].push(product);
    });
    return grouped;
  }, [products]);

  const sortedCategoryIds = useMemo(() => {
    return Object.keys(groupedProducts).sort((a, b) => {
      const orderA = orderMap[a] ?? 999;
      const orderB = orderMap[b] ?? 999;
      return orderA - orderB;
    });
  }, [groupedProducts, orderMap]);

  if (sortedCategoryIds.length === 0) {
    return null;
  }

  return (
    <>
      {sortedCategoryIds.map((categoryId) => {
        const categoryProducts = groupedProducts[categoryId];
        const categoryName = categoryMap[categoryId] || 'Inne';

        return (
          <View key={categoryId} className="mb-6">
            <View className="flex-row items-center mb-3 px-4">
              <View className="w-1 h-5 bg-blue-500 rounded-full mr-2" />
              <Text className="text-lg font-bold text-gray-800">
                {categoryName}
              </Text>
              <Text className="text-sm text-gray-400 ml-2">
                ({categoryProducts.length})
              </Text>
            </View>
            <View>
              {categoryProducts.map((product, index) => (
                <ProductItem
                  key={product.id}
                  product={product}
                  onToggle={() => onToggleProduct(product.id, true)}
                  onEdit={onEditProduct ? () => onEditProduct(product.id) : undefined}
                  isPending={togglePending && pendingProductId === product.id}
                  isLast={index === categoryProducts.length - 1}
                />
              ))}
            </View>
          </View>
        );
      })}
    </>
  );
};
