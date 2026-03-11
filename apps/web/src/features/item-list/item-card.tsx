import { Checkbox } from "@/components/ui/checkbox";
import type { ShoppingItemWithCategory } from "@/entities/shopping-item/model";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: ShoppingItemWithCategory;
  onToggleStatus: (id: string, status: "pending" | "purchased") => void;
}

export function ItemCard({ item, onToggleStatus }: ItemCardProps) {
  const isPurchased = item.status === "purchased";

  const handleToggle = () => {
    onToggleStatus(item.id, isPurchased ? "pending" : "purchased");
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-none border-b p-3 transition-all last:border-b-0",
        isPurchased && "opacity-60"
      )}
    >
      <Checkbox checked={isPurchased} onCheckedChange={handleToggle} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "truncate font-medium text-sm",
            isPurchased && "line-through"
          )}
        >
          {item.name}
        </span>

        {(item.quantity || item.note) && (
          <span className="truncate text-muted-foreground text-xs">
            {[item.quantity, item.note].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>

      {item.category && (
        <span
          className="shrink-0 rounded-none px-2 py-0.5 text-xs"
          style={{
            backgroundColor: item.category.color
              ? `${item.category.color}20`
              : undefined,
            color: item.category.color ?? undefined,
          }}
        >
          {item.category.name}
        </span>
      )}
    </div>
  );
}
