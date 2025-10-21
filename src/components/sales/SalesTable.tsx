
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Sale } from "@/types/sales";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from 'react-to-print';
import { ReceiptTemplate } from "@/components/sales/ReceiptTemplate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Package } from "lucide-react";

interface SalesTableProps {
  sales: Sale[];
  showBusinessInfo?: boolean;
}

const SalesTable = ({ sales, showBusinessInfo = false }: SalesTableProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStoreLogo();
  }, []);

  const fetchStoreLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('logo_url')
        .single();

      if (error) throw error;
      if (data?.logo_url) {
        setLogoUrl(data.logo_url);
      }
    } catch (error) {
      console.error('Error fetching store logo:', error);
    }
  };

  const handlePrintCallback = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: 'Receipt',
    onAfterPrint: () => {
      console.log('Print completed successfully');
      toast({
        title: "Success",
        description: "Receipt sent to printer successfully",
      });
      setSelectedSale(null);
    },
    onPrintError: (error) => {
      console.error('Print error:', error);
      toast({
        title: "Print Error",
        description: "Failed to print receipt. Please check your printer connection.",
        variant: "destructive",
      });
      setSelectedSale(null);
    },
  });

  const handlePrintInvoice = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    console.log("Reprinting invoice with logo:", logoUrl);
    setSelectedSale(sale);
    
    // Wait for receipt to render, then trigger print
    setTimeout(() => {
      handlePrintCallback();
    }, 100);
  };

  return (
    <>
      {selectedSale && (
        <div style={{ display: 'none' }}>
          <ReceiptTemplate
            ref={receiptRef}
            items={selectedSale.items}
            discount={0}
            saleType={selectedSale.saleType}
            date={new Date(selectedSale.date)}
            logoUrl={logoUrl}
            cashierName={selectedSale.cashierName || (user ? user.username || user.name : undefined)}
            cashierEmail={selectedSale.cashierEmail || (user ? user.email : undefined)}
            customerName={selectedSale.customerName}
            customerPhone={selectedSale.customerPhone}
            businessName={selectedSale.businessName}
            businessAddress={selectedSale.businessAddress}
          />
        </div>
      )}
      <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price (₦)</TableHead>
            <TableHead>Total (₦)</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Cashier</TableHead>
            {showBusinessInfo && <TableHead>Customer/Business</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length > 0 ? (
            sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{sale.items[0].name}{sale.items.length > 1 ? ` +${sale.items.length - 1} more` : ''}</TableCell>
                <TableCell>
                  {sale.saleType === 'wholesale' ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Package className="h-3 w-3 mr-1" />
                      Wholesale
                    </Badge>
                  ) : (
                    <Badge variant="outline">Retail</Badge>
                  )}
                </TableCell>
                <TableCell>{sale.items[0].quantity}</TableCell>
                <TableCell>{sale.items[0].price}</TableCell>
                <TableCell>{sale.total}</TableCell>
                <TableCell>{sale.date}</TableCell>
                <TableCell>{sale.cashierName || 'Unknown'}</TableCell>
                {showBusinessInfo && (
                  <TableCell>
                    {sale.businessName || sale.customerName || 'Walk-in Customer'}
                  </TableCell>
                )}
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    sale.status === "completed" 
                      ? "bg-green-50 text-green-700" 
                      : "bg-yellow-50 text-yellow-700"
                  }`}>
                    {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handlePrintInvoice(sale.id)}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={showBusinessInfo ? 10 : 9} className="h-24 text-center">
                No sales found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    </>
  );
};

export default SalesTable;
