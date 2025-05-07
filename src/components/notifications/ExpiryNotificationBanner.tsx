
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInventory } from "@/hooks/useInventory";

interface ExpiryNotificationBannerProps {
  onDismiss: () => void;
}

export const ExpiryNotificationBanner = ({ onDismiss }: ExpiryNotificationBannerProps) => {
  const navigate = useNavigate();
  const { getExpiringItems } = useInventory();
  
  // Get items expiring in the next 30 days (critical)
  const criticalItems = getExpiringItems(30);
  // Get items expiring in the next 90 days
  const warningItems = getExpiringItems(90);
  
  // Don't show if there are no expiring items
  if (warningItems.length === 0) {
    return null;
  }
  
  const handleViewReport = () => {
    navigate("/reports", { state: { activeTab: "expiring" } });
  };
  
  return (
    <div className="bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 border border-amber-200 rounded-lg p-4 mb-4 relative">
      <button 
        onClick={onDismiss}
        className="absolute top-2 right-2 text-amber-500 hover:text-amber-700"
        aria-label="Close notification"
      >
        <X className="h-5 w-5" />
      </button>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0 bg-amber-200 p-2 rounded-full">
          <Calendar className="h-6 w-6 text-amber-700" />
        </div>
        
        <div className="flex-grow">
          <h3 className="text-lg font-medium text-amber-800 flex items-center gap-2">
            Drug Expiry Alert
            {criticalItems.length > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                Critical
              </span>
            )}
          </h3>
          
          <p className="text-amber-700 mt-1">
            {criticalItems.length > 0 ? (
              <>
                <strong>{criticalItems.length}</strong> products are expiring in the next 30 days and require immediate attention.
              </>
            ) : (
              <>
                <strong>{warningItems.length}</strong> products are expiring in the next 90 days.
              </>
            )}
          </p>
        </div>
        
        <div className="mt-3 sm:mt-0">
          <Button 
            onClick={handleViewReport}
            variant="default" 
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            View Expiry Report
          </Button>
        </div>
      </div>
    </div>
  );
};
