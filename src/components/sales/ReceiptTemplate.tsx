import { forwardRef } from "react";
import { SaleItem } from "@/types/sales";

interface ReceiptTemplateProps {
  items: SaleItem[];
  discount: number;
  cashierName?: string;
  cashierEmail?: string;
  customerName?: string;
  customerPhone?: string;
  businessName?: string;
  businessAddress?: string;
  saleType: 'retail' | 'wholesale';
  date: Date;
  logoUrl?: string;
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>((props, ref) => {
  const {
    items,
    discount = 0,
    date = new Date(),
    cashierName,
    customerName,
    customerPhone,
    saleType = 'retail',
    logoUrl,
    businessName = 'PharmCare Pro',
    businessAddress = '123 Main Street, Lagos'
  } = props;

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  const formattedDate = date.toLocaleDateString();
  const formattedTime = date.toLocaleTimeString();

  return (
    <div ref={ref} style={{ padding: '20px', maxWidth: '300px', fontFamily: 'monospace', fontSize: '12px' }}>
      <style>
        {`
          @media print {
            @page {
              margin: 0;
              size: 80mm 297mm;
            }
            body {
              margin: 0;
              padding: 10px;
            }
          }
        `}
      </style>
      
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt="Store Logo" 
            style={{ maxWidth: '150px', maxHeight: '80px', margin: '0 auto 10px', display: 'block' }}
          />
        )}
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{businessName}</div>
        <div>{businessAddress}</div>
        <div>{saleType.toUpperCase()} RECEIPT</div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

      <div style={{ marginBottom: '10px' }}>
        <div>Date: {formattedDate}</div>
        <div>Time: {formattedTime}</div>
        {customerName && <div>Customer: {customerName}</div>}
        {customerPhone && <div>Phone: {customerPhone}</div>}
        {cashierName && <div>Cashier: {cashierName}</div>}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '3px 0' }}>Item</th>
            <th style={{ textAlign: 'left', padding: '3px 0' }}>Qty</th>
            <th style={{ textAlign: 'left', padding: '3px 0' }}>Price</th>
            <th style={{ textAlign: 'right', padding: '3px 0' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td style={{ padding: '3px 0' }}>{item.name}</td>
              <td style={{ padding: '3px 0' }}>{item.quantity}</td>
              <td style={{ padding: '3px 0' }}>₦{item.price.toLocaleString()}</td>
              <td style={{ textAlign: 'right', padding: '3px 0' }}>₦{(item.price * item.quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

      <table style={{ width: '100%' }}>
        <tbody>
          <tr>
            <td>Subtotal:</td>
            <td style={{ textAlign: 'right' }}>₦{subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Discount ({discount}%):</td>
            <td style={{ textAlign: 'right' }}>₦{discountAmount.toLocaleString()}</td>
          </tr>
          <tr style={{ fontWeight: 'bold' }}>
            <td>Total:</td>
            <td style={{ textAlign: 'right' }}>₦{total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px' }}>
        Thank you for your patronage!<br />
        <strong>POWERED BY T-TECH SOLUTIONS</strong>
      </div>
    </div>
  );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';
