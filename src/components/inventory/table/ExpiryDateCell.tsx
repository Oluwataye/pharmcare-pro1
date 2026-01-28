import React from "react";
import { Calendar, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InventoryItem } from "@/types/inventory";

interface ExpiryDateCellProps {
  item: InventoryItem;
}

export const ExpiryDateCell = ({ item }: ExpiryDateCellProps) => {
  const batches = item.batches || [];
  // Calculate earliest expiry from batches if available, otherwise use master record
  const effectiveExpiryDate = batches.length > 0
    ? batches.reduce((earliest, batch) => {
      return new Date(batch.expiryDate) < new Date(earliest) ? batch.expiryDate : earliest;
    }, batches[0].expiryDate)
    : item.expiryDate;

  const getExpiryStatus = (date?: string) => {
    if (!date) return { color: "", message: "No expiry date" };

    const today = new Date();
    const expiry = new Date(date);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { color: "text-red-600", message: "Expired" };
    }
    if (daysUntilExpiry <= 30) {
      return { color: "text-red-600", message: "Expires soon" };
    }
    if (daysUntilExpiry <= 90) {
      return { color: "text-yellow-600", message: "Expiry approaching" };
    }
    return { color: "", message: "Valid" };
  };

  const expiryStatus = getExpiryStatus(effectiveExpiryDate);

  if (!effectiveExpiryDate && batches.length === 0) {
    return <span>N/A</span>;
  }

  return (
    <div className={expiryStatus.color}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-help">
              <Calendar className="h-4 w-4" />
              {batches.length > 1 ? (
                <span className="underline decoration-dotted">
                  {batches.length} Batches
                </span>
              ) : (
                effectiveExpiryDate ? new Date(effectiveExpiryDate).toLocaleDateString() : 'N/A'
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="p-0 border-none">
            <div className="bg-popover text-popover-foreground rounded-md border shadow-md p-3 text-xs max-w-[300px]">
              {batches.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-semibold border-b pb-1">Batch Breakdown (FEFO)</p>
                  {batches
                    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                    .map((batch, idx) => (
                      <div key={idx} className="flex justify-between gap-4">
                        <span className="font-mono text-muted-foreground">{batch.batchNumber}</span>
                        <div className="text-right">
                          <div className={getExpiryStatus(batch.expiryDate).color}>
                            {new Date(batch.expiryDate).toLocaleDateString()}
                          </div>
                          <div className="text-muted-foreground">Qty: {batch.quantity}</div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p>{expiryStatus.message}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
