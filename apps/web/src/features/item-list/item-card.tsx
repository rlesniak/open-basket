import { IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ShoppingItemWithCategory } from "@/entities/shopping-item/model";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: ShoppingItemWithCategory;
  onDelete: (id: string) => void;
  onEdit: (item: ShoppingItemWithCategory) => void;
  onToggleStatus: (id: string, status: "pending" | "purchased") => void;
}

export function ItemCard({
  item,
  onToggleStatus,
  onEdit,
  onDelete,
}: ItemCardProps) {
  const isPurchased = item.status === "purchased";

  const handleToggle = () => {
    onToggleStatus(item.id, isPurchased ? "pending" : "purchased");
  };

  return (
    <div
      className={cn(
        "group flex w-full items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3 shadow-sm transition-all hover:border-primary/50",
        isPurchased && "opacity-50 grayscale"
      )}
    >
      <div className="flex items-center">
        <Checkbox
          checked={isPurchased}
          className="h-5 w-5 rounded-full"
          onCheckedChange={handleToggle}
        />
      </div>

      <button
        className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left outline-none"
        onClick={handleToggle}
        type="button"
      >
        <span
          className={cn(
            "truncate font-medium text-base transition-all",
            isPurchased && "text-muted-foreground line-through"
          )}
        >
          {item.name}
        </span>
        {(item.quantity || item.note) && (
          <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
            {item.quantity && (
              <span
                className="shrink-0 rounded-md bg-muted px-1.5 py-0.5"
                title="Ilość"
              >
                📦 {item.quantity}
              </span>
            )}
            {item.note && (
              <span
                className="max-w-30 shrink-0 truncate rounded-md bg-muted px-1.5 py-0.5"
                title="Notatka"
              >
                📝 {item.note}
              </span>
            )}
          </span>
        )}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <IconDotsVertical className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => onEdit(item)}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edytuj
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(item.id)}
            variant="destructive"
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Usuń
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
