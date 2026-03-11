"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Store } from "@/entities/store/model";

interface StoreListProps {
  onSelectStore: (storeId: string) => void;
  selectedStoreId: string | null;
  stores: Store[];
}

export function StoreList({
  stores,
  selectedStoreId,
  onSelectStore,
}: StoreListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stores.map((store) => (
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          data-selected={selectedStoreId === store.id}
          key={store.id}
          onClick={() => onSelectStore(store.id)}
        >
          <CardHeader>
            <CardTitle>{store.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              Click to manage categories
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
