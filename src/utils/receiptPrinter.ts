
interface PrintReceiptProps {
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  customerName?: string;
  customerPhone?: string;
  date?: Date;
}

export const printReceipt = async ({ items, customerName, customerPhone, date = new Date() }: PrintReceiptProps) => {
  if (!('printer' in navigator)) {
    throw new Error('Printing is not supported in this browser');
  }

  const printContent = `
    <html>
      <head>
        <title>Sale Receipt</title>
        <style>
          body { font-family: monospace; font-size: 12px; }
          .header { text-align: center; margin-bottom: 10px; }
          .item { margin: 5px 0; }
          .total { margin-top: 10px; border-top: 1px solid #000; }
          .customer-info { margin-top: 5px; margin-bottom: 10px; }
          .footer { 
            margin-top: 20px; 
            text-align: center; 
            border-top: 1px solid #000; 
            padding-top: 10px; 
            font-size: 10px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>PharmaCare Pro</h2>
          <p>Sale Receipt</p>
          <p>${date.toLocaleString()}</p>
        </div>
        <div class="customer-info">
          <p>Customer: ${customerName || 'Walk-in Customer'}</p>
          <p>Phone: ${customerPhone || 'N/A'}</p>
        </div>
        ${items.map(item => `
          <div class="item">
            ${item.name}<br/>
            ${item.quantity} x ₦${item.price} = ₦${item.total}
          </div>
        `).join('')}
        <div class="total">
          <p>Total: ₦${items.reduce((sum, item) => sum + item.total, 0)}</p>
        </div>
        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>Powered By T-Tech Solutions</p>
        </div>
      </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  iframe.contentDocument?.write(printContent);
  iframe.contentDocument?.close();

  iframe.contentWindow?.print();
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 1000);
};
