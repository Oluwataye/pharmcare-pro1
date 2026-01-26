
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash, ClipboardCheck } from "lucide-react";

interface TableActionsProps {
  itemId: string;
  onEdit: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onAdjust?: (itemId: string) => void;
}

export const TableActions = ({ itemId, onEdit, onDelete, onAdjust }: TableActionsProps) => {
  return (
    <div className="flex justify-end gap-2">
      {onAdjust && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onAdjust(itemId)}
          title="Adjust Stock"
          className="text-primary hover:text-primary hover:bg-primary/10"
        >
          <ClipboardCheck className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(itemId)}
        title="Edit Product"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(itemId)}
        className="text-destructive hover:text-destructive"
        title="Delete Product"
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
};
