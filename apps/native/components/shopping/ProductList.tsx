import { View, Text } from 'react-native';
import { Card } from 'heroui-native';
import { useMemo } from 'react';
import { Product, Category, StoreCategoryOrder } from '@/types/shopping';
import { ProductItem } from '@/components/shopping/ProductItem';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  storeCategoryOrders: StoreCategoryOrder[];
  onToggleProduct: (productId: string, isPurchased: boolean) => void;
  togglePending: boolean;
  pendingProductId?: string;
}

export const ProductList = ({
  products,
  categories,
  storeCategoryOrders,
  onToggleProduct,
  togglePending,
  pendingProductId,
}: ProductListProps) => {
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
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
          <View key={categoryId} className="mb-4">
            <Text className="text-lg font-bold text-gray-800 mb-2 px-1">
              {categoryName}
            </Text>
            <Card className="p-2">
              {categoryProducts.map((product, index) => (
                <ProductItem
                  key={product.id}
                  product={product}
                  onToggle={() => onToggleProduct(product.id, true)}
                  isPending={togglePending && pendingProductId === product.id}
                  isLast={index === categoryProducts.length - 1}
                />
              ))}
            </Card>
          </View>
        );
      })}
    </>
  );
};
