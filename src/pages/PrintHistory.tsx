import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Printer, RefreshCw, Download, FileText, CheckCircle, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReceiptReprint } from '@/hooks/sales/useReceiptReprint';
import { ReceiptPreview } from '@/components/receipts/ReceiptPreview';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedCard } from '@/components/ui/EnhancedCard';
import { EnhancedStatCard } from '@/components/admin/EnhancedStatCard';
import { RefundDialog } from '@/components/refunds/RefundDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PrintAnalytic {
  id: string;
  created_at: string;
  sale_id: string | null;
  cashier_name: string | null;
  customer_name: string | null;
  print_status: 'success' | 'failed' | 'cancelled';
  error_type: string | null;
  error_message: string | null;
  print_duration_ms: number | null;
  is_reprint: boolean;
  sale_type: string | null;
  total_amount: number | null;
}

const PrintHistory = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { fetchAndPreviewReceipt, executePrint, showPreview, setShowPreview, previewData, openPrintWindow } = useReceiptReprint();

  const [analytics, setAnalytics] = useState<PrintAnalytic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    cashier: '',
    customer: '',
    status: 'all',
  });

  // Refund dialog state
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<{
    saleId: string;
    transactionId: string;
    amount: number;
    customerName?: string;
  } | null>(null);

  const [stats, setStats] = useState({
    totalPrints: 0,
    successRate: 0,
    failedPrints: 0,
    avgDuration: 0,
  });

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('print_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }
      if (filters.cashier) {
        query = query.ilike('cashier_name', `%${filters.cashier}%`);
      }
      if (filters.customer) {
        query = query.ilike('customer_name', `%${filters.customer}%`);
      }
      if (filters.status !== 'all') {
        query = query.eq('print_status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAnalytics((data as PrintAnalytic[]) || []);

      // Calculate stats
      if (data && data.length > 0) {
        const successfulPrints = data.filter(a => a.print_status === 'success').length;
        const failedPrints = data.filter(a => a.print_status === 'failed').length;
        const totalDuration = data.reduce((sum, a) => sum + (a.print_duration_ms || 0), 0);

        setStats({
          totalPrints: data.length,
          successRate: (successfulPrints / data.length) * 100,
          failedPrints,
          avgDuration: data.length > 0 ? totalDuration / data.length : 0,
        });
      } else {
        setStats({ totalPrints: 0, successRate: 0, failedPrints: 0, avgDuration: 0 });
      }
    } catch (error: any) {
      console.error('Error fetching print analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load print history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const handleReprint = async (saleId: string) => {
    if (!saleId) {
      toast({
        title: 'Error',
        description: 'Cannot reprint: Sale ID not found',
        variant: 'destructive',
      });
      return;
    }
    // Open window synchronously to capture gesture
    const windowRef = openPrintWindow();
    await fetchAndPreviewReceipt(saleId, windowRef);
  };

  const handleRefund = (analytic: PrintAnalytic) => {
    if (!analytic.sale_id) {
      toast({
        title: 'Error',
        description: 'Cannot refund: Sale ID not found',
        variant: 'destructive',
      });
      return;
    }
    setSelectedRefund({
      saleId: analytic.sale_id,
      transactionId: analytic.sale_id, // Using sale_id as transaction_id
      amount: analytic.total_amount || 0,
      customerName: analytic.customer_name || undefined,
    });
    setShowRefundDialog(true);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Cashier', 'Customer', 'Status', 'Error Type', 'Duration (ms)', 'Is Reprint', 'Sale Type', 'Amount'];
    const rows = analytics.map(a => [
      format(new Date(a.created_at), 'yyyy-MM-dd HH:mm:ss'),
      a.cashier_name || 'N/A',
      a.customer_name || 'N/A',
      a.print_status,
      a.error_type || 'N/A',
      a.print_duration_ms?.toString() || 'N/A',
      a.is_reprint ? 'Yes' : 'No',
      a.sale_type || 'N/A',
      a.total_amount?.toString() || 'N/A',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `print-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Print history exported to CSV',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Print History</h1>
          <p className="text-muted-foreground">Track and analyze all receipt print operations</p>
        </div>
        <Button onClick={exportToCSV} disabled={analytics.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <EnhancedStatCard
          title="Total Prints"
          value={stats.totalPrints.toString()}
          icon={FileText}
          trend=""
          trendUp={true}
          onClick={() => { }}
          route="/print-history"
          colorScheme="primary"
          comparisonLabel="History period"
        />
        <EnhancedStatCard
          title="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={CheckCircle}
          trend=""
          trendUp={true}
          onClick={() => { }}
          route="/print-history"
          colorScheme="success"
          comparisonLabel="Vs failures"
        />
        <EnhancedStatCard
          title="Failed Prints"
          value={stats.failedPrints.toString()}
          icon={AlertCircle}
          trend=""
          trendUp={false}
          onClick={() => { }}
          route="/print-history"
          colorScheme="danger"
          comparisonLabel="Critical errors"
        />
        <EnhancedStatCard
          title="Avg Duration"
          value={`${stats.avgDuration.toFixed(0)}ms`}
          icon={Clock}
          trend=""
          trendUp={true}
          onClick={() => { }}
          route="/print-history"
          colorScheme="warning"
          comparisonLabel="Latency"
        />
      </div>

      {/* Filters */}
      <EnhancedCard colorScheme="primary">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter print history by date, cashier, customer, or status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => setFilters({ ...filters, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => setFilters({ ...filters, endDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashier">Cashier</Label>
              <Input
                id="cashier"
                placeholder="Search cashier..."
                value={filters.cashier}
                onChange={(e) => setFilters({ ...filters, cashier: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Input
                id="customer"
                placeholder="Search customer..."
                value={filters.customer}
                onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setFilters({ startDate: undefined, endDate: undefined, cashier: '', customer: '', status: 'all' })}
            >
              Clear Filters
            </Button>
            <Button variant="outline" onClick={fetchAnalytics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Print History Table */}
      <EnhancedCard colorScheme="primary">
        <CardHeader>
          <CardTitle>Print Records</CardTitle>
          <CardDescription>Detailed history of all print operations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : analytics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No print records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.map((analytic) => (
                    <TableRow key={analytic.id}>
                      <TableCell className="font-medium">
                        {format(new Date(analytic.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{analytic.cashier_name || 'N/A'}</TableCell>
                      <TableCell>{analytic.customer_name || 'Walk-in'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            analytic.print_status === 'success'
                              ? 'default'
                              : analytic.print_status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {analytic.print_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={analytic.is_reprint ? 'outline' : 'secondary'}>
                          {analytic.is_reprint ? 'Reprint' : 'Original'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {analytic.error_type ? (
                          <span className="text-xs text-destructive" title={analytic.error_message || undefined}>
                            {analytic.error_type}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{analytic.print_duration_ms ? `${analytic.print_duration_ms}ms` : '-'}</TableCell>
                      <TableCell>
                        {analytic.total_amount ? `₦${Number(analytic.total_amount).toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex gap-1">
                            {/* Reprint Button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReprint(analytic.sale_id!)}
                                  disabled={!analytic.sale_id}
                                >
                                  <Printer className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {analytic.sale_id ? 'Reprint Receipt' : 'Sale ID not available'}
                              </TooltipContent>
                            </Tooltip>

                            {/* Refund Button - Only show for successful prints */}
                            {analytic.print_status === 'success' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRefund(analytic)}
                                    disabled={!analytic.sale_id || !analytic.total_amount}
                                  >
                                    <DollarSign className="w-4 h-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {analytic.sale_id && analytic.total_amount
                                    ? 'Request Refund'
                                    : 'Refund not available'}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </EnhancedCard>

      {/* Receipt Preview Modal */}
      {previewData && (
        <ReceiptPreview
          receiptData={previewData}
          onPrint={() => {
            const windowRef = openPrintWindow();
            executePrint(undefined, windowRef);
          }}
          onOpenChange={(open) => setShowPreview(open)}
          open={showPreview}
        />
      )}

      {/* Refund Dialog */}
      {selectedRefund && (
        <RefundDialog
          open={showRefundDialog}
          onOpenChange={setShowRefundDialog}
          saleId={selectedRefund.saleId}
          transactionId={selectedRefund.transactionId}
          originalAmount={selectedRefund.amount}
          customerName={selectedRefund.customerName}
        />
      )}
    </div>
  );
};

export default PrintHistory;
