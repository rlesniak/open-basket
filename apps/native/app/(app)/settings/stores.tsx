import { useState } from 'react';
import { View, ScrollView, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { Button, Card } from 'heroui-native';
import { useStores, useCreateExceptionStore } from '@/hooks/shopping/useShopping';
import { Store } from '@/types/shopping';

export default function ManageStoresScreen() {
  const { data: stores = [] } = useStores();
  const createStoreMutation = useCreateExceptionStore();

  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreKeywords, setNewStoreKeywords] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) return;

    await createStoreMutation.mutateAsync({
      name: newStoreName.trim(),
      keywords: newStoreKeywords.trim(),
    });

    setNewStoreName('');
    setNewStoreKeywords('');
    setShowAddForm(false);
  };

  const exceptionStores = stores.filter((s: Store) => s.keywords);
  const regularStores = stores.filter((s: Store) => !s.keywords);

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Zarządzaj sklepami' }} />

      <ScrollView className="flex-1 p-4">
        {/* Regular Stores */}
        <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 ml-1">
          Sklepy standardowe
        </Text>
        <Card className="p-4 mb-6">
          {regularStores.map((store: Store) => (
            <View key={store.id} className="py-3 border-b border-gray-100 last:border-b-0">
              <Text className="text-base font-medium text-gray-900">{store.name}</Text>
            </View>
          ))}
        </Card>

        {/* Exception Stores */}
        <View className="flex-row items-center justify-between mb-3 ml-1">
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Sklepy wyjątkowe
          </Text>
          <Button size="sm" onPress={() => setShowAddForm(!showAddForm)}>
            <Button.Label>{showAddForm ? 'Anuluj' : 'Dodaj'}</Button.Label>
          </Button>
        </View>

        {showAddForm && (
          <Card className="p-4 mb-4">
            <Text className="text-sm font-medium text-gray-600 mb-2">Nazwa sklepu</Text>
            <TextInput
              value={newStoreName}
              onChangeText={setNewStoreName}
              placeholder="np. DELI, Piekarnia"
              className="text-base text-gray-900 pb-2 border-b border-gray-200 mb-4"
            />

            <Text className="text-sm font-medium text-gray-600 mb-2">Słowa kluczowe (AI)</Text>
            <TextInput
              value={newStoreKeywords}
              onChangeText={setNewStoreKeywords}
              placeholder="deli, z deli, delikatesy"
              className="text-base text-gray-900 pb-2 border-b border-gray-200 mb-2"
            />
            <Text className="text-xs text-gray-400 mb-4">
              AI rozpozna te słowa w inpucie użytkownika
            </Text>

            <Button
              onPress={handleCreateStore}
              isDisabled={!newStoreName.trim() || createStoreMutation.isPending}
            >
              <Button.Label>Utwórz sklep</Button.Label>
            </Button>
          </Card>
        )}

        <Card className="p-4">
          {exceptionStores.length === 0 ? (
            <Text className="text-gray-400 text-center py-4">
              Brak sklepów wyjątkowych
            </Text>
          ) : (
            exceptionStores.map((store: Store) => (
              <View key={store.id} className="py-3 border-b border-gray-100 last:border-b-0">
                <Text className="text-base font-medium text-gray-900">{store.name}</Text>
                {store.keywords && (
                  <Text className="text-sm text-gray-500 mt-1">
                    Słowa kluczowe: {store.keywords}
                  </Text>
                )}
              </View>
            ))
          )}
        </Card>

        {/* Info */}
        <Card className="p-4 mt-6 bg-blue-50">
          <Text className="text-sm text-blue-800">
            💡 W sklepach wyjątkowych pokazują się tylko produkty przypisane do nich.
            Produkty globalne są widoczne we wszystkich sklepach.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}
