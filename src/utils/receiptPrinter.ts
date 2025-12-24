
import { SaleItem } from "@/types/sales";

export interface StoreSettings {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  print_show_logo: boolean;
  print_show_address: boolean;
  print_show_email: boolean;
  print_show_phone: boolean;
  print_show_footer: boolean;
}

export interface PrintReceiptProps {
  items: SaleItem[];
  discount?: number;
  date?: Date;
  cashierName?: string;
  cashierEmail?: string;
  customerName?: string;
  customerPhone?: string;
  businessName?: string;
  businessAddress?: string;
  saleType?: 'retail' | 'wholesale';
  cashierId?: string;
  saleId?: string;
  storeSettings: StoreSettings;
}

export enum PrintError {
  POPUP_BLOCKED = 'POPUP_BLOCKED',
  IMAGE_LOAD_FAILED = 'IMAGE_LOAD_FAILED',
  PRINT_CANCELLED = 'PRINT_CANCELLED',
  WINDOW_LOAD_FAILED = 'WINDOW_LOAD_FAILED',
  UNKNOWN = 'UNKNOWN',
}

class PrintReceiptError extends Error {
  constructor(public type: PrintError, message: string) {
    super(message);
    this.name = 'PrintReceiptError';
  }
}

// Preload image with timeout
const preloadImage = (url: string, timeout = 3000): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => {
      resolve(null);
    }, timeout);

    img.onload = () => {
      clearTimeout(timer);
      resolve(url);
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    img.src = url;
  });
};

// Receipt printing implementation for modern browsers and thermal printers (using window.open)
export const printReceipt = async (props: PrintReceiptProps): Promise<boolean> => {
  console.log("Printing receipt", props);
  
  return new Promise(async (resolve, reject) => {
    try {
      // Preload logo image if present
      let logoUrl = props.storeSettings.logo_url;
      if (logoUrl && props.storeSettings.print_show_logo) {
        const preloadedLogo = await preloadImage(logoUrl);
        if (!preloadedLogo) {
          console.warn('Logo failed to load, continuing without logo');
          logoUrl = null;
        }
      }

      // Generate receipt HTML content
      const receiptContent = generateReceiptHTML({ ...props, storeSettings: { ...props.storeSettings, logo_url: logoUrl } });

      // Open a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        reject(new PrintReceiptError(
          PrintError.POPUP_BLOCKED,
          "Print window was blocked. Please allow popups for this site and try again."
        ));
        return;
      }

      // Write content to the new window
      printWindow.document.write(receiptContent);
      printWindow.document.close();

      let printCompleted = false;

      // Wait for content to load before printing
      printWindow.onload = () => {
        try {
          // Add small delay to ensure images are loaded
          setTimeout(() => {
            // Trigger print dialog
            printWindow.print();
            
            // Listen for when print dialog closes
            printWindow.onafterprint = () => {
              printCompleted = true;
              printWindow.close();
              resolve(true);
            };
            
            // Increased timeout to 5 seconds to give user time to print
            setTimeout(() => {
              if (!printWindow.closed) {
                printWindow.close();
              }
              if (!printCompleted) {
                // User may have cancelled
                console.log('Print dialog closed without confirmation');
              }
              resolve(true);
            }, 5000);
          }, 500);
          
        } catch (err) {
          printWindow.close();
          reject(new PrintReceiptError(
            PrintError.UNKNOWN,
            "Failed to open print dialog. Please check your printer settings."
          ));
        }
      };
      
      // Handle window load errors
      printWindow.onerror = (error) => {
        console.error('Print window error:', error);
        printWindow.close();
        reject(new PrintReceiptError(
          PrintError.WINDOW_LOAD_FAILED,
          "Failed to load receipt content. Please try again."
        ));
      };
      
    } catch (error) {
      reject(new PrintReceiptError(
        PrintError.UNKNOWN,
        error instanceof Error ? error.message : "An unknown error occurred while printing."
      ));
    }
  });
};

// Helper function to generate receipt HTML
function generateReceiptHTML(props: PrintReceiptProps): string {
  const {
    items,
    discount = 0,
    date = new Date(),
    cashierName,
    customerName,
    customerPhone,
    businessName,
    businessAddress,
    saleType = 'retail',
    storeSettings
  } = props;
  
  // Use store settings from props
  const storeName = storeSettings.name || 'PharmCare Pro';
  const storeAddress = storeSettings.address || '123 Main Street, Lagos';
  const storeEmail = storeSettings.email;
  const storePhone = storeSettings.phone;
  const logo = storeSettings.logo_url;
  
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate discount amount
  const discountAmount = subtotal * (discount / 100);
  
  // Calculate total
  const total = subtotal - discountAmount;
  
  // Format date
  const formattedDate = date.toLocaleDateString();
  const formattedTime = date.toLocaleTimeString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt</title>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Courier New', monospace;
          margin: 0;
          padding: 20px;
          max-width: 300px;
          font-size: 12px;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .logo {
          max-width: 150px;
          max-height: 80px;
          margin: 0 auto 10px;
          display: block;
        }
        .business-name {
          font-size: 16px;
          font-weight: bold;
        }
        .info {
          margin-bottom: 10px;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          text-align: left;
          padding: 3px 0;
        }
        .amount {
          text-align: right;
        }
        .total {
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 10px;
        }
        @media print {
          body {
            margin: 0;
            padding: 10px;
          }
          @page {
            margin: 0;
            size: 80mm 297mm; /* Standard thermal receipt size */
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${storeSettings.print_show_logo && logo ? `<img src="${logo}" alt="Store Logo" class="logo" />` : ''}
        <div class="business-name">${storeName}</div>
        ${storeSettings.print_show_address && storeAddress ? `<div>${storeAddress}</div>` : ''}
        ${storeSettings.print_show_email && storeEmail ? `<div>${storeEmail}</div>` : ''}
        ${storeSettings.print_show_phone && storePhone ? `<div>${storePhone}</div>` : ''}
        <div>${saleType.toUpperCase()} RECEIPT</div>
      </div>
      
      <div class="divider"></div>
      
      <div class="info">
        <div>Date: ${formattedDate}</div>
        <div>Time: ${formattedTime}</div>
        ${customerName ? `<div>Customer: ${customerName}</div>` : ''}
        ${customerPhone ? `<div>Phone: ${customerPhone}</div>` : ''}
        ${businessName ? `<div>Business: ${businessName}</div>` : ''}
        ${businessAddress ? `<div>Address: ${businessAddress}</div>` : ''}
        ${cashierName ? `<div>Cashier: ${cashierName}</div>` : ''}
      </div>
      
      <div class="divider"></div>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>₦${item.price.toLocaleString()}</td>
              <td class="amount">₦${(item.price * item.quantity).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="divider"></div>
      
      <table>
        <tr>
          <td>Subtotal:</td>
          <td class="amount">₦${subtotal.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Discount (${discount}%):</td>
          <td class="amount">₦${discountAmount.toLocaleString()}</td>
        </tr>
        <tr class="total">
          <td>Total:</td>
          <td class="amount">₦${total.toLocaleString()}</td>
        </tr>
      </table>
      
      <div class="divider"></div>
      
      ${storeSettings.print_show_footer ? `
      <div class="footer">
        Thank you for your patronage!<br>
        <strong>POWERED BY T-TECH SOLUTIONS</strong>
      </div>
      ` : ''}
    </body>
    </html>
  `;
}
