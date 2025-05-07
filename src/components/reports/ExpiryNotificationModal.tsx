
import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, AlertTriangle } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";

interface ExpiryNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewReport: () => void;
}

export const ExpiryNotificationModal = ({
  open,
  onOpenChange,
  onViewReport,
}: ExpiryNotificationModalProps) => {
  const { getExpiringItems } = useInventory();
  
  // Get items expiring in the next 30 days (critical)
  const criticalItems = getExpiringItems(30);
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle>Drug Expiry Alert</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {criticalItems.length > 0 ? (
              <div className="space-y-4">
                <p className="text-red-600 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Critical: {criticalItems.length} products are expiring within 30 days!
                </p>
                <div className="max-h-[200px] overflow-y-auto border rounded-md p-2">
                  <ul className="space-y-1">
                    {criticalItems.slice(0, 5).map((item) => (
                      <li key={item.id} className="text-sm">
                        <span className="font-medium">{item.name}</span> - Expires on{" "}
                        <span className="text-red-600 font-medium">
                          {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "N/A"}
                        </span>
                      </li>
                    ))}
                    {criticalItems.length > 5 && (
                      <li className="text-sm text-muted-foreground">
                        And {criticalItems.length - 5} more...
                      </li>
                    )}
                  </ul>
                </div>
                <p className="text-sm">
                  These products require immediate attention. Would you like to view the full expiry report?
                </p>
              </div>
            ) : (
              <p>
                There are products in your inventory that will expire soon. Would you like to view the expiry report?
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Later</AlertDialogCancel>
          <AlertDialogAction onClick={onViewReport} className="bg-amber-500 hover:bg-amber-600">
            View Expiry Report
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
