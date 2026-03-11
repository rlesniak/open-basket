"use client";

import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StoreWithCategories } from "@/entities/store/model";

interface CategoryOrderEditorProps {
  isPending: boolean;
  onMoveDown: (categoryId: string, currentPosition: number) => void;
  onMoveUp: (categoryId: string, currentPosition: number) => void;
  store: StoreWithCategories;
}

export function CategoryOrderEditor({
  store,
  isPending,
  onMoveUp,
  onMoveDown,
}: CategoryOrderEditorProps) {
  const sortedCategories = [...store.categories].sort(
    (a, b) => a.position - b.position
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{store.name} - Category Order</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {sortedCategories.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === sortedCategories.length - 1;

            return (
              <div
                className="flex items-center justify-between border-b py-2 last:border-b-0"
                key={item.category.id}
              >
                <span className="font-medium text-sm">
                  {item.category.name}
                </span>
                <div className="flex gap-1">
                  <Button
                    aria-label={`Move ${item.category.name} up`}
                    disabled={isFirst || isPending}
                    onClick={() => onMoveUp(item.category.id, item.position)}
                    size="icon"
                    variant="ghost"
                  >
                    <IconArrowUp />
                  </Button>
                  <Button
                    aria-label={`Move ${item.category.name} down`}
                    disabled={isLast || isPending}
                    onClick={() => onMoveDown(item.category.id, item.position)}
                    size="icon"
                    variant="ghost"
                  >
                    <IconArrowDown />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
