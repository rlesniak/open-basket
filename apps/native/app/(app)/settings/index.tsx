import { View, ScrollView, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from 'heroui-native';
import { useStores } from '@/hooks/shopping/useShopping';

export default function SettingsScreen() {
  const router = useRouter();
  const { data: stores } = useStores();

  return (
    <ScrollView className="flex-1 p-4">
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
    </ScrollView>
  );
}
