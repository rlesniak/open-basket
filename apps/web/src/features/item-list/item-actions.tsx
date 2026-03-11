import { IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ItemActionsProps {
  onDelete: () => void;
  onEdit: () => void;
}

export function ItemActions({ onEdit, onDelete }: ItemActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-none text-muted-foreground transition-colors hover:text-foreground">
        <IconDotsVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <IconEdit className="h-4 w-4" />
          Edytuj
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} variant="destructive">
          <IconTrash className="h-4 w-4" />
          Usuń
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
