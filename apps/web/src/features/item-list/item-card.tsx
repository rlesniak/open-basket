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
  const quantityLabel = item.quantity?.trim();
  const noteLabel = item.note?.trim();

  const handleToggle = () => {
    onToggleStatus(item.id, isPurchased ? "pending" : "purchased");
  };

  return (
    <div
      className={cn(
        "group flex min-h-16 w-full items-center gap-3 px-3 py-3 transition-colors",
        isPurchased && "opacity-60"
      )}
    >
      <div className="flex shrink-0 items-center">
        <Checkbox
          checked={isPurchased}
          className="h-6 w-6 rounded-full border-2 border-white/30"
          onCheckedChange={handleToggle}
        />
      </div>

      <button
        className="flex min-h-10 min-w-0 flex-1 flex-col justify-center gap-1 text-left outline-none"
        onClick={handleToggle}
        type="button"
      >
        <div className="flex w-full items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className={cn(
                "block truncate font-semibold text-[15px] text-zinc-50 leading-snug transition-all",
                isPurchased && "text-zinc-500 line-through"
              )}
            >
              {item.name}
            </span>
            {noteLabel && (
              <span className="mt-0.5 block truncate text-[12px] text-zinc-400">
                📝 {noteLabel}
              </span>
            )}
          </div>

          {quantityLabel && (
            <span className="shrink-0 rounded-full border border-amber-300/18 bg-amber-300/12 px-2.5 py-1 font-semibold text-[12px] text-amber-100">
              📦 {quantityLabel}
            </span>
          )}
        </div>
      </button>

      <div className="flex shrink-0 items-center">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/8 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <IconDotsVertical className="h-4.5 w-4.5" />
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
    </div>
  );
}
