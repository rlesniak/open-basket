import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Store } from "@/entities/store/model";

interface StoreDropdownProps {
  disabled?: boolean;
  onStoreChange: (storeId: string) => void;
  selectedStoreId: string | null;
  stores: Store[];
}

export function StoreDropdown({
  stores,
  selectedStoreId,
  onStoreChange,
  disabled = false,
}: StoreDropdownProps) {
  console.log(stores);
  return (
    <Select
      disabled={disabled}
      onValueChange={(value) => value && onStoreChange(value)}
      value={selectedStoreId ?? undefined}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select store...">
          {stores.find((store) => store.id === selectedStoreId)?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
