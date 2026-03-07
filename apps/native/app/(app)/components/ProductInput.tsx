import { View, Pressable, Text } from 'react-native';
import { Card, Input, Spinner } from 'heroui-native';

interface ProductInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const ProductInput = ({ value, onChangeText, onSubmit, isLoading }: ProductInputProps) => {
  return (
    <Card className="m-4 p-4">
      <View className="flex-row gap-2">
        <Input
          value={value}
          onChangeText={onChangeText}
          placeholder="np. mleko 10 sztuk, 3.2%"
          className="flex-1"
          onSubmitEditing={onSubmit}
        />
        <Pressable
          onPress={onSubmit}
          disabled={!value.trim() || isLoading}
          className={`px-4 py-2 rounded-lg flex-row items-center ${
            !value.trim() || isLoading
              ? 'bg-gray-300'
              : 'bg-blue-500'
          }`}
        >
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            <Text className="text-white font-medium">Dodaj</Text>
          )}
        </Pressable>
      </View>
    </Card>
  );
};
