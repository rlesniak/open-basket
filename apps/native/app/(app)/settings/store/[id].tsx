import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function StoreCategories() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-2xl font-bold">Kolejność kategorii</Text>
      <Text className="mt-2 text-gray-500">Sklep ID: {id}</Text>
    </View>
  );
}
