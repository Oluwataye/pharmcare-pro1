
import { SaleItem } from "@/types/sales";

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
  logoUrl?: string;
}

// Receipt printing implementation for modern browsers and thermal printers (using window.open)
export const printReceipt = async (props: PrintReceiptProps): Promise<boolean> => {
  console.log("Printing receipt", props);
  
  try {
    // Generate receipt HTML content
    const receiptContent = generateReceiptHTML(props);

    // Open a new window for printing, which is more reliable for triggering the print dialog
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Popup blocked - inform the user and suggest a fallback
      // NOTE: In a real application, replace this console.warn with a user-facing notification (e.g., a toast or modal)
      console.warn("Printing failed: The popup window was blocked. Please allow popups for this site or use the browser's print function (Ctrl+P/Cmd+P) after manually opening the receipt.");
      return false;
    }

    // Write content to the new window
    printWindow.document.write(receiptContent);
    printWindow.document.close();

    // Wait for content to be fully written and rendered before printing
    // The onload event is a reliable way to ensure the content is ready.
    printWindow.onload = () => {
      // Check if the print dialog was successfully opened (a rough check)
      if (!printWindow.document.body.innerHTML) {
        // This can happen if the window was closed immediately or if there was an issue
        // NOTE: In a real application, replace this console.warn with a user-facing notification
        console.warn("Could not initiate print dialog. Please try again.");
        return;
      }
      
      try {
        printWindow.print();
        // Close the window after printing is initiated
        // Use a small delay to ensure the print job is sent before closing
        setTimeout(() => printWindow.close(), 100); 
      } catch (err) {
        // Print action failed - inform the user
        // NOTE: In a real application, replace this console.error with a user-facing notification
        console.error("Error during printing. Please check your printer connection and settings.", err);
        // Attempt to close the window even if printing failed
        printWindow.close();
      }
    };
    
    return true;
  } catch (error) {
    console.error("Failed to print receipt:", error);
    return false;
  }
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
    saleType = 'retail',
    logoUrl
  } = props;
  
  // Get store settings from localStorage or use defaults
  const storeSettings = JSON.parse(localStorage.getItem('storeSettings') || '{}');
  const storeName = storeSettings.name || 'PharmCare Pro';
  const storeAddress = storeSettings.address || '123 Main Street, Lagos';
  const logo = logoUrl || storeSettings.logo_url;
  
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
        ${logo ? `<img src="${logo}" alt="Store Logo" class="logo" />` : ''}
        <div class="business-name">${storeName}</div>
        <div>${storeAddress}</div>
        <div>${saleType.toUpperCase()} RECEIPT</div>
      </div>
      
      <div class="divider"></div>
      
      <div class="info">
        <div>Date: ${formattedDate}</div>
        <div>Time: ${formattedTime}</div>
        ${customerName ? `<div>Customer: ${customerName}</div>` : ''}
        ${customerPhone ? `<div>Phone: ${customerPhone}</div>` : ''}
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
      
      <div class="footer">
        Thank you for your patronage!<br>
        <strong>POWERED BY T-TECH SOLUTIONS</strong>
      </div>
    </body>
    </html>
  `;
}
