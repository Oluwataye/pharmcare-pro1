
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";

interface EmptyTableRowProps {
  colSpan: number;
  message?: string;
}

export const EmptyTableRow = ({ colSpan, message = "No products found" }: EmptyTableRowProps) => {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center">
        {message}
      </TableCell>
    </TableRow>
  );
};
