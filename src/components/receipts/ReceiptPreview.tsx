import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PrintReceiptProps } from "@/utils/receiptPrinter";

interface ReceiptPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: PrintReceiptProps;
  onPrint: () => void;
}

export const ReceiptPreview = ({ open, onOpenChange, receiptData, onPrint }: ReceiptPreviewProps) => {
  const {
    items = [],
    discount = 0,
    date: receiptDate,
    dispenserName,
    customerName,
    customerPhone,
    businessName,
    businessAddress,
    saleType = 'retail',
    storeSettings: rawStoreSettings
  } = receiptData;

  // ENSURE items is an array before reduce
  const safeItems = Array.isArray(items) ? items : [];

  // Use store settings from receipt data with fallback
  const storeSettings = rawStoreSettings || {
    name: 'PharmCare Pro',
    address: null,
    phone: null,
    email: null,
    logo_url: null,
    print_show_logo: false,
    print_show_address: true,
    print_show_email: true,
    print_show_phone: true,
    print_show_footer: true
  };

  const storeName = storeSettings.name || 'PharmCare Pro';
  const storeAddress = storeSettings.address || 'Address Not Set';
  const storeEmail = storeSettings.email;
  const storePhone = storeSettings.phone;
  const logo = storeSettings.logo_url;

  // Validate and ensure date is a valid Date object
  let date = new Date();
  if (receiptDate) {
    const parsedDate = receiptDate instanceof Date ? receiptDate : new Date(receiptDate);
    if (!isNaN(parsedDate.getTime())) {
      date = parsedDate;
    }
  }

  // Calculate totals
  const subtotal = safeItems.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receipt Preview</DialogTitle>
        </DialogHeader>

        <div className="border rounded-md p-4 bg-background font-mono text-xs">
          {/* Header */}
          <div className="text-center mb-4">
            {storeSettings.print_show_logo && logo && (
              <img
                src={logo}
                alt="Store Logo"
                className="max-w-[150px] max-h-[80px] mx-auto mb-2"
              />
            )}
            <div className="font-bold text-base">{storeName}</div>
            {storeSettings.print_show_address && storeAddress && <div>{storeAddress}</div>}
            {storeSettings.print_show_email && storeEmail && <div>{storeEmail}</div>}
            {storeSettings.print_show_phone && storePhone && <div>{storePhone}</div>}
            <div className="mt-2 font-bold">{saleType.toUpperCase()} RECEIPT</div>
          </div>

          <div className="border-t border-dashed border-border my-2" />

          {/* Info */}
          <div className="mb-2 space-y-1">
            <div>Date: {date.toLocaleDateString()}</div>
            <div>Time: {date.toLocaleTimeString()}</div>
            {customerName && <div>Customer: {customerName}</div>}
            {customerPhone && <div>Phone: {customerPhone}</div>}
            {businessName && <div>Business: {businessName}</div>}
            {businessAddress && <div>Address: {businessAddress}</div>}
            {dispenserName && <div>Dispenser: {dispenserName}</div>}
          </div>

          <div className="border-t border-dashed border-border my-2" />

          {/* Items */}
          <table className="w-full mb-2">
            <thead>
              <tr className="text-left">
                <th className="pb-1">Item</th>
                <th className="pb-1">Qty</th>
                <th className="pb-1">Price</th>
                <th className="pb-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {safeItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1">{item?.name || 'Unknown'}</td>
                  <td>{item?.quantity || 0}</td>
                  <td>₦{(item?.price || 0).toLocaleString()}</td>
                  <td className="text-right">₦{((item?.price || 0) * (item?.quantity || 0)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-border my-2" />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount ({discount}%):</span>
              <span>₦{discountAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-sm">
              <span>Total:</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-border my-2" />

          {/* Footer */}
          {storeSettings.print_show_footer && (
            <div className="text-center text-[10px] mt-4">
              <div>Thank you for your patronage!</div>
              <div className="font-bold mt-1">POWERED BY T-TECH SOLUTIONS</div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onPrint}>
            Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
