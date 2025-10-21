
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

// Cross-browser compatible receipt printing implementation
export const printReceipt = async (props: PrintReceiptProps): Promise<boolean> => {
  console.log("Printing receipt", props);
  
  return new Promise((resolve, reject) => {
    try {
      // Create an iframe for printing (off-screen but with proper dimensions)
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '300px';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
      
      // Generate receipt HTML content
      const receiptContent = generateReceiptHTML(props);
      
      // Set content to iframe document
      const iframeWindow = iframe.contentWindow;
      const iframeDocument = iframeWindow?.document;
      
      if (!iframeDocument || !iframeWindow) {
        document.body.removeChild(iframe);
        reject(new Error("Unable to access iframe document"));
        return;
      }
      
      iframeDocument.open();
      iframeDocument.write(receiptContent);
      iframeDocument.close();
      
      // Track print dialog state
      let printDialogOpened = false;
      let cleanupTimer: NodeJS.Timeout | null = null;
      
      // Cleanup function
      const cleanup = () => {
        if (cleanupTimer) clearTimeout(cleanupTimer);
        try {
          if (iframe && iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        } catch (cleanupErr) {
          console.error("Error removing iframe:", cleanupErr);
        }
      };
      
      // Listen for print events
      const handleBeforePrint = () => {
        console.log("Print dialog opened");
        printDialogOpened = true;
      };
      
      const handleAfterPrint = () => {
        console.log("Print dialog closed");
        // Delay cleanup to ensure print job is fully sent to printer
        setTimeout(() => {
          cleanup();
          resolve(true);
        }, 5000); // Wait 5 seconds before cleanup
      };
      
      // Add event listeners for print events
      if (iframeWindow.matchMedia) {
        const mediaQueryList = iframeWindow.matchMedia('print');
        mediaQueryList.addListener((mql) => {
          if (mql.matches) {
            handleBeforePrint();
          } else {
            handleAfterPrint();
          }
        });
      }
      
      iframeWindow.addEventListener('beforeprint', handleBeforePrint);
      iframeWindow.addEventListener('afterprint', handleAfterPrint);
      
      // Wait for content and images to load before printing
      const checkImagesLoaded = () => {
        const images = iframeDocument.getElementsByTagName('img');
        if (images.length === 0) return true;
        
        let allLoaded = true;
        for (let i = 0; i < images.length; i++) {
          if (!images[i].complete) {
            allLoaded = false;
            console.log(`Image ${i} not loaded yet`);
            break;
          }
        }
        return allLoaded;
      };
      
      // Wait for images to load or timeout after 5 seconds
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds with 100ms intervals
      
      const checkAndPrint = () => {
        attempts++;
        
        if (checkImagesLoaded() || attempts >= maxAttempts) {
          if (attempts >= maxAttempts) {
            console.warn("Timeout waiting for images, proceeding with print anyway");
          }
          
          try {
            console.log("Triggering print dialog...");
            
            // Focus the iframe before printing
            iframeWindow.focus();
            
            // Trigger print
            iframeWindow.print();
            
            // Fallback: If print dialog doesn't open within 5 seconds, resolve anyway
            cleanupTimer = setTimeout(() => {
              if (!printDialogOpened) {
                console.log("Print dialog did not open, resolving anyway");
                cleanup();
                resolve(true);
              }
            }, 5000);
            
          } catch (err) {
            console.error("Error during printing:", err);
            cleanup();
            reject(err);
          }
        } else {
          setTimeout(checkAndPrint, 100);
        }
      };
      
      // Wait for iframe to be ready, then start checking
      iframe.onload = () => {
        console.log("Iframe loaded, waiting for images...");
        // Give more time for content to render
        setTimeout(checkAndPrint, 1000);
      };
      
      // Fallback if onload doesn't fire
      setTimeout(() => {
        if (attempts === 0) {
          console.log("Starting print check (fallback)");
          checkAndPrint();
        }
      }, 1000);
      
    } catch (error) {
      console.error("Failed to print receipt:", error);
      reject(error);
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
