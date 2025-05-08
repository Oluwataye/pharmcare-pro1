
import React from "react";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

interface BatchDeleteBarProps {
  selectedCount: number;
  onBatchDelete: () => void;
}

export const BatchDeleteBar = ({ selectedCount, onBatchDelete }: BatchDeleteBarProps) => {
  return (
    <div className="flex justify-between items-center py-2 mb-2 bg-muted/30 px-3 rounded-md">
      <div className="text-sm">
        {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
      </div>
      <Button 
        variant="destructive" 
        size="sm"
        onClick={onBatchDelete}
      >
        <Trash className="h-4 w-4 mr-1" /> Delete Selected
      </Button>
    </div>
  );
};
