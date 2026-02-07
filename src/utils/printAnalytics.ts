import { supabase } from '@/integrations/supabase/client';

export interface LogPrintAnalyticsParams {
  saleId?: string;
  receiptId?: string;
  dispenserId?: string;
  dispenserName?: string;
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
    // Defensive check: Only insert sale_id and receipt_id if they are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const saleId = params.saleId && uuidRegex.test(params.saleId) ? params.saleId : null;
    const receiptId = params.receiptId && uuidRegex.test(params.receiptId) ? params.receiptId : null;

    const { error } = await supabase
      .from('print_analytics')
      .insert([{
        sale_id: saleId,
        receipt_id: receiptId,
        cashier_id: params.dispenserId || null,
        cashier_name: params.dispenserName || null,
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
