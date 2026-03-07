import { View, ScrollView, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Store } from '../types/shopping';
import { STORE_COLORS } from '../utils/constants';

interface StoreSelectorProps {
  stores: Store[];
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
  isLoading: boolean;
}

export const StoreSelector = ({ stores, selectedStoreId, onSelectStore, isLoading }: StoreSelectorProps) => {
  const handleSelectStore = (storeId: string) => {
    onSelectStore(storeId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View className="px-4 pb-2">
      <Text className="text-sm text-gray-600 mb-2">Wybierz sklep:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        {isLoading ? (
          <Text className="text-gray-500">Ładowanie sklepów...</Text>
        ) : (
          stores.map((store) => (
            <Pressable
              key={store.id}
              onPress={() => handleSelectStore(store.id)}
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
  );
};
