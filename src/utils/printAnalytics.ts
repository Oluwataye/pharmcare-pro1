import { supabase } from '@/integrations/supabase/client';

export interface LogPrintAnalyticsParams {
  saleId?: string;
  receiptId?: string;
  cashierId?: string;
  cashierName?: string;
  customerName?: string;
  printStatus: 'success' | 'failed' | 'cancelled';
  errorType?: string;
  errorMessage?: string;
  printDurationMs?: number;
  isReprint?: boolean;
  saleType?: string;
  totalAmount?: number;
}

export const logPrintAnalytics = async (params: LogPrintAnalyticsParams) => {
  try {
    const { error } = await supabase
      .from('print_analytics')
      .insert([{
        sale_id: params.saleId || null,
        receipt_id: params.receiptId || null,
        cashier_id: params.cashierId || null,
        cashier_name: params.cashierName || null,
        customer_name: params.customerName || undefined,
        print_status: params.printStatus,
        error_type: params.errorType || null,
        error_message: params.errorMessage || null,
        print_duration_ms: params.printDurationMs || null,
        is_reprint: params.isReprint || false,
        sale_type: params.saleType || null,
        total_amount: params.totalAmount || null,
      }]);

    if (error) {
      console.error('Error logging print analytics:', error);
    }
  } catch (error) {
    console.error('Error logging print analytics:', error);
  }
};
