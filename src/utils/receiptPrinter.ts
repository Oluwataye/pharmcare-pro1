
interface PrintReceiptProps {
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
    discount?: number;
  }>;
  customerName?: string;
  customerPhone?: string;
  date?: Date;
  discount?: number;
}

export const printReceipt = async ({ items, customerName, customerPhone, date = new Date(), discount = 0 }: PrintReceiptProps) => {
  if (!('printer' in navigator)) {
    throw new Error('Printing is not supported in this browser');
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discount / 100) + items.reduce((sum, item) => 
    sum + (item.price * item.quantity * ((item.discount || 0) / 100)), 0);
  const total = subtotal - discountAmount;

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
            ${item.quantity} x ₦${item.price} = ₦${item.quantity * item.price}
            ${item.discount ? `<br/>Discount: ${item.discount}% (₦${(item.price * item.quantity * item.discount / 100).toFixed(2)})` : ''}
          </div>
        `).join('')}
        <div class="total">
          <p>Subtotal: ₦${subtotal.toFixed(2)}</p>
          ${discount > 0 ? `<p>Overall Discount: ${discount}% (₦${(subtotal * discount / 100).toFixed(2)})</p>` : ''}
          ${discountAmount > 0 ? `<p>Total Discount: ₦${discountAmount.toFixed(2)}</p>` : ''}
          <p>Total: ₦${total.toFixed(2)}</p>
        </div>
        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>2025 © T-Tech Solutions</p>
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
