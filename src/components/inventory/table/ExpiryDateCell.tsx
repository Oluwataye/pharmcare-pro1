
import React from "react";
import { Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExpiryDateCellProps {
  expiryDate?: string;
}

export const ExpiryDateCell = ({ expiryDate }: ExpiryDateCellProps) => {
  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { color: "", message: "No expiry date" };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
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
  
  const expiryStatus = getExpiryStatus(expiryDate);

  if (!expiryDate) {
    return <span>N/A</span>;
  }

  return (
    <div className={expiryStatus.color}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(expiryDate).toLocaleDateString()}
            </div>
          </TooltipTrigger>
          <TooltipContent>{expiryStatus.message}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
