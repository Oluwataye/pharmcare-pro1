
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { InventoryItem } from "@/types/inventory";
import { generateInventoryReport } from "@/utils/inventoryUtils";

export const useInventoryPrint = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handlePrint = async (inventory: InventoryItem[]) => {
    try {
      const username = user ? user.username || user.name : 'Unknown';
      // Create print content
      const printContent = generateInventoryReport(inventory, username);

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }

      toast({
        title: "Success",
        description: "Inventory report sent to printer",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to print",
        variant: "destructive",
      });
    }
  };

  return { handlePrint };
};
