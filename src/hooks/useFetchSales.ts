import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleItem } from '@/types/sales';
import { useToast } from '@/hooks/use-toast';

export const useFetchSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      
      // Fetch sales with their items
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          sales_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            price,
            discount,
            is_wholesale,
            total
          )
        `)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      // Transform data to match Sale type
      const transformedSales: Sale[] = (salesData || []).map(sale => ({
        id: sale.id,
        items: (sale.sales_items || []).map((item: any) => ({
          id: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          price: Number(item.price),
          unitPrice: Number(item.unit_price),
          discount: Number(item.discount || 0),
          isWholesale: item.is_wholesale || false,
          total: Number(item.total)
        })) as SaleItem[],
        total: Number(sale.total),
        date: sale.created_at,
        status: sale.status as 'completed' | 'pending',
        customerName: sale.customer_name || undefined,
        customerPhone: sale.customer_phone || undefined,
        discount: Number(sale.discount || 0),
        cashierName: sale.cashier_name || undefined,
        cashierEmail: sale.cashier_email || undefined,
        cashierId: sale.cashier_id || undefined,
        transactionId: sale.transaction_id || undefined,
        businessName: sale.business_name || undefined,
        businessAddress: sale.business_address || undefined,
        saleType: sale.sale_type as 'retail' | 'wholesale'
      }));

      setSales(transformedSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: "Error",
        description: "Failed to load sales data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();

    // Set up real-time subscription for new sales
    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales'
        },
        () => {
          // Refresh sales when changes occur
          fetchSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { sales, isLoading, refreshSales: fetchSales };
};
