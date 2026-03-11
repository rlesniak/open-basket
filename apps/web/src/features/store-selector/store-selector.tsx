import { IconSettings } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { Store } from "@/entities/store/model";
import { StoreDropdown } from "./store-dropdown";

interface StoreSelectorProps {
  isLoading?: boolean;
  onStoreChange: (storeId: string) => void;
  selectedStoreId: string | null;
  stores: Store[];
}

export function StoreSelector({
  stores,
  selectedStoreId,
  onStoreChange,
  isLoading = false,
}: StoreSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <StoreDropdown
        disabled={isLoading}
        onStoreChange={onStoreChange}
        selectedStoreId={selectedStoreId}
        stores={stores}
      />
      <Link to="/stores">
        <Button size="icon" variant="ghost">
          <IconSettings />
        </Button>
      </Link>
    </div>
  );
}
