
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";

interface TableActionsProps {
  itemId: string;
  onEdit: (itemId: string) => void;
  onDelete: (itemId: string) => void;
}

export const TableActions = ({ itemId, onEdit, onDelete }: TableActionsProps) => {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(itemId)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(itemId)}
        className="text-destructive hover:text-destructive"
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
};
