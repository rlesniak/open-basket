import { ScrollView, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from 'heroui-native';
import { useStores } from '@/hooks/shopping/useShopping';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: stores } = useStores();

  return (
    <ScrollView className="flex-1 p-4" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Text className="text-sm text-gray-500 mb-4 uppercase font-semibold">
        Sklepy
      </Text>

      {stores?.map((store) => (
        <Pressable
          key={store.id}
          onPress={() => router.push(`/settings/store/${store.id}` as any)}
          className="mb-2"
        >
          <Card>
            <Card.Body className="flex-row justify-between items-center">
              <Text className="text-lg">{store.name}</Text>
              <Text className="text-gray-400">›</Text>
            </Card.Body>
          </Card>
        </Pressable>
      ))}

      <Text className="text-xs text-gray-500 mt-4">
        Kliknij sklep, aby ustawić kolejność kategorii według układu sklepu
      </Text>

      <Text className="text-sm text-gray-500 mb-4 uppercase font-semibold mt-8">
        Zarządzanie
      </Text>

      <Pressable
        onPress={() => router.push('/settings/stores' as any)}
        className="mb-2"
      >
        <Card>
          <Card.Body className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg">Sklepy wyjątkowe</Text>
              <Text className="text-sm text-gray-500">Zarządzaj sklepami i słowami kluczowymi</Text>
            </View>
            <Text className="text-gray-400">›</Text>
          </Card.Body>
        </Card>
      </Pressable>
    </ScrollView>
  );
}
