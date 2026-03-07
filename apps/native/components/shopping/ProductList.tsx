import { View, Text } from 'react-native';
import { Card } from 'heroui-native';
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
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Inne';
  };

  const getCategoryOrder = (categoryId: string): number => {
    const order = storeCategoryOrders.find((o) => o.categoryId === categoryId);
    return order?.orderIndex || 999;
  };

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

  const groupedProducts = groupProductsByCategory(products);
  
  const sortedCategoryIds = Object.keys(groupedProducts).sort((a, b) => {
    const orderA = getCategoryOrder(a);
    const orderB = getCategoryOrder(b);
    return orderA - orderB;
  });

  if (sortedCategoryIds.length === 0) {
    return null;
  }

  return (
    <>
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
