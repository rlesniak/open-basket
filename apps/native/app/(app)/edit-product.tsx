import { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Spinner } from 'heroui-native';
import { useCategories, useProducts, useStores, useUpdateProduct } from '@/hooks/shopping/useShopping';
import { Category, Store } from '@/types/shopping';

const UNITS = ['szt', 'kg', 'l', 'opak'] as const;

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

export default function EditProductModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: stores = [] } = useStores();
  const updateProductMutation = useUpdateProduct();

  const product = products.find((p) => p.id === id);

  const [name, setName] = useState('');
  const [qty, setQty] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [note, setNote] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [assignedStoreId, setAssignedStoreId] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showStorePicker, setShowStorePicker] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setQty(product.qty?.toString() ?? '');
      setUnit(product.unit ?? '');
      setNote(product.note ?? '');
      setSelectedCategoryId(product.categoryId);
      setAssignedStoreId(product.assignedStoreId);
    }
  }, [product]);

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const handleSave = async () => {
    if (!name.trim() || !selectedCategoryId) return;

    await updateProductMutation.mutateAsync({
      productId: id,
      name: name.trim(),
      qty: qty ? parseInt(qty, 10) : null,
      unit: unit.trim() || null,
      note: note.trim() || null,
      categoryId: selectedCategoryId,
      assignedStoreId: assignedStoreId || null,
    });

    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  const selectedCategory = categories.find((c: Category) => c.id === selectedCategoryId);
  const assignedStore = stores.find((s: Store) => s.id === assignedStoreId);
  const isLoading = updateProductMutation.isPending;
  const isValid = name.trim() && selectedCategoryId;

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <Stack.Screen
        options={{
          title: 'Edytuj produkt',
          presentation: 'modal',
          headerLeft: () => (
            <Button variant="ghost" onPress={handleCancel} size="sm" className="ml-2">
              <Button.Label>Anuluj</Button.Label>
            </Button>
          ),
          headerRight: () => (
            <Button
              onPress={handleSave}
              isDisabled={!isValid || isLoading}
              size="sm"
              className="mr-2"
            >
              {isLoading ? (
                <Spinner size="sm" color="white" />
              ) : (
                <Button.Label>Zapisz</Button.Label>
              )}
            </Button>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        <Card className="p-5">
          {/* Product Name */}
          <View className="mb-5">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Nazwa produktu
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="np. Mleko 3.2%"
              className="text-lg font-medium text-gray-900 pb-2 border-b border-gray-200"
              autoFocus
            />
          </View>

          {/* Category */}
          <View className="mb-5">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Kategoria
            </Text>
            <Pressable
              onPress={() => {
                setShowCategoryPicker(!showCategoryPicker);
                setShowUnitPicker(false);
              }}
              className="flex-row items-center justify-between py-2 border-b border-gray-200"
            >
              <View className="flex-row items-center">
                {selectedCategory && (
                  <Text className="text-xl mr-2">
                    {CATEGORY_EMOJIS[selectedCategory.id] || '📦'}
                  </Text>
                )}
                <Text className="text-base text-gray-900">
                  {selectedCategory?.name ?? 'Wybierz kategorię'}
                </Text>
              </View>
              <Text className="text-gray-400 text-lg">{showCategoryPicker ? '▲' : '▼'}</Text>
            </Pressable>

            {showCategoryPicker && (
              <View className="mt-2 bg-gray-50 rounded-xl p-2">
                <View className="flex-row flex-wrap">
                  {categories.map((category: Category) => (
                    <Pressable
                      key={category.id}
                      onPress={() => {
                        setSelectedCategoryId(category.id);
                        setShowCategoryPicker(false);
                      }}
                      className={`m-1 px-4 py-2.5 rounded-full flex-row items-center ${
                        selectedCategoryId === category.id
                          ? 'bg-blue-500'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <Text className="text-base mr-1.5">
                        {CATEGORY_EMOJIS[category.id] || '📦'}
                      </Text>
                      <Text
                        className={`text-sm font-medium ${
                          selectedCategoryId === category.id ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Store Assignment */}
          <View className="mb-5">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Przypisanie do sklepu
            </Text>
            <Pressable
              onPress={() => {
                setShowStorePicker(!showStorePicker);
                setShowCategoryPicker(false);
                setShowUnitPicker(false);
              }}
              className="flex-row items-center justify-between py-2 border-b border-gray-200"
            >
              <Text className={`text-base ${assignedStoreId ? 'text-gray-900' : 'text-gray-400'}`}>
                {assignedStore ? assignedStore.name : 'Wszystkie sklepy (globalny)'}
              </Text>
              <Text className="text-gray-400 text-lg">{showStorePicker ? '▲' : '▼'}</Text>
            </Pressable>

            {showStorePicker && (
              <View className="mt-2 bg-gray-50 rounded-xl p-2">
                <Pressable
                  onPress={() => {
                    setAssignedStoreId(null);
                    setShowStorePicker(false);
                  }}
                  className={`py-3 px-4 rounded-lg mb-1 ${
                    !assignedStoreId ? 'bg-blue-500' : 'bg-white'
                  }`}
                >
                  <Text className={`font-medium ${!assignedStoreId ? 'text-white' : 'text-gray-700'}`}>
                    Wszystkie sklepy
                  </Text>
                </Pressable>
                {stores.map((store: Store) => (
                  <Pressable
                    key={store.id}
                    onPress={() => {
                      setAssignedStoreId(store.id);
                      setShowStorePicker(false);
                    }}
                    className={`py-3 px-4 rounded-lg mb-1 ${
                      assignedStoreId === store.id ? 'bg-blue-500' : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        assignedStoreId === store.id ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {store.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Quantity Row */}
          <View className="mb-5">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Ilość
            </Text>
            <View className="flex-row gap-3">
              <TextInput
                value={qty}
                onChangeText={setQty}
                placeholder="10"
                keyboardType="number-pad"
                className="flex-1 text-base text-gray-900 pb-2 border-b border-gray-200"
              />
              <View className="flex-1">
                <Pressable
                  onPress={() => {
                    setShowUnitPicker(!showUnitPicker);
                    setShowCategoryPicker(false);
                  }}
                  className="flex-row items-center justify-between pb-2 border-b border-gray-200"
                >
                  <Text className={`text-base ${unit ? 'text-gray-900' : 'text-gray-400'}`}>
                    {unit || 'Jednostka'}
                  </Text>
                  <Text className="text-gray-400">{showUnitPicker ? '▲' : '▼'}</Text>
                </Pressable>

                {showUnitPicker && (
                  <View className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-10">
                    <View className="flex-row flex-wrap p-2">
                      {UNITS.map((u) => (
                        <Pressable
                          key={u}
                          onPress={() => {
                            setUnit(u);
                            setShowUnitPicker(false);
                          }}
                          className={`m-1 px-4 py-2 rounded-lg ${
                            unit === u ? 'bg-blue-500' : 'bg-gray-100'
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              unit === u ? 'text-white' : 'text-gray-700'
                            }`}
                          >
                            {u}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Pressable
                      onPress={() => {
                        setUnit('');
                        setShowUnitPicker(false);
                      }}
                      className="px-4 py-3 border-t border-gray-100"
                    >
                      <Text className="text-sm text-gray-500 text-center">Wyczyść</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Note */}
          <View>
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Notatka
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Dodatkowe informacje..."
              multiline
              numberOfLines={2}
              className="text-base text-gray-900 pb-2 border-b border-gray-200"
            />
          </View>
        </Card>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
