export interface ThermalPrinterConfig {
  vendorId?: number;
  productId?: number;
  interface?: number;
}

export class ThermalPrinterService {
  private device: USBDevice | null = null;

  // Common thermal printer vendor and product IDs
  private commonPrinters = [
    { vendorId: 0x0416, productId: 0x5011 }, // BIXOLON
    { vendorId: 0x0416, productId: 0x5011 }, // BIXOLON SPP-R200
    { vendorId: 0x0416, productId: 0x5011 }, // BIXOLON SPP-R300
    { vendorId: 0x04b8, productId: 0x0e15 }, // EPSON
    { vendorId: 0x04b8, productId: 0x0e03 }, // EPSON TM-T20
    { vendorId: 0x04b8, productId: 0x0202 }, // EPSON TM-U220
  ];

  // ESC/POS commands
  private commands = {
    INIT: [0x1B, 0x40], // Initialize printer
    CUT: [0x1D, 0x56, 0x41, 0x10], // Full cut
    ALIGN_LEFT: [0x1B, 0x61, 0x00], // Left alignment
    ALIGN_CENTER: [0x1B, 0x61, 0x01], // Center alignment
    ALIGN_RIGHT: [0x1B, 0x61, 0x02], // Right alignment
    BOLD_ON: [0x1B, 0x45, 0x01], // Bold on
    BOLD_OFF: [0x1B, 0x45, 0x00], // Bold off
    TEXT_NORMAL: [0x1B, 0x21, 0x00], // Normal text size
    TEXT_LARGE: [0x1B, 0x21, 0x30], // Large text size
    LINE_FEED: [0x0A], // Line feed
  };

  async connect(): Promise<boolean> {
    try {
      if (!navigator.usb) {
        throw new Error('WebUSB API not supported in this browser');
      }

      // Request device access
      this.device = await navigator.usb.requestDevice({
        filters: this.commonPrinters
      });

      if (!this.device) {
        throw new Error('No printer selected');
      }

      await this.device.open();
      await this.device.selectConfiguration(1);
      await this.device.claimInterface(0);

      console.log('Thermal printer connected successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect to thermal printer:', error);
      return false;
    }
  }

  async printReceipt(receiptData: {
    businessName: string;
    businessAddress: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    discount: number;
    total: number;
    cashierName?: string;
    customerName?: string;
    date: string;
  }): Promise<boolean> {
    if (!this.device) {
      throw new Error('Printer not connected');
    }

    try {
      let data = new Uint8Array();

      // Initialize printer
      data = this.concatArrays(data, new Uint8Array(this.commands.INIT));
      
      // Center alignment for header
      data = this.concatArrays(data, new Uint8Array(this.commands.ALIGN_CENTER));
      data = this.concatArrays(data, new Uint8Array(this.commands.BOLD_ON));
      data = this.concatArrays(data, this.textToUint8Array(receiptData.businessName + '\n'));
      data = this.concatArrays(data, new Uint8Array(this.commands.BOLD_OFF));
      data = this.concatArrays(data, this.textToUint8Array(receiptData.businessAddress + '\n'));
      data = this.concatArrays(data, new Uint8Array(this.commands.LINE_FEED));

      // Left alignment for receipt content
      data = this.concatArrays(data, new Uint8Array(this.commands.ALIGN_LEFT));
      data = this.concatArrays(data, this.textToUint8Array(`Date: ${receiptData.date}\n`));
      
      if (receiptData.cashierName) {
        data = this.concatArrays(data, this.textToUint8Array(`Cashier: ${receiptData.cashierName}\n`));
      }
      
      if (receiptData.customerName) {
        data = this.concatArrays(data, this.textToUint8Array(`Customer: ${receiptData.customerName}\n`));
      }

      data = this.concatArrays(data, this.textToUint8Array('--------------------------------\n'));

      // Items
      data = this.concatArrays(data, new Uint8Array(this.commands.BOLD_ON));
      data = this.concatArrays(data, this.textToUint8Array('Item           Qty  Price  Amt\n'));
      data = this.concatArrays(data, new Uint8Array(this.commands.BOLD_OFF));
      
      receiptData.items.forEach(item => {
        const name = item.name.substring(0, 14).padEnd(14);
        const qty = item.quantity.toString().padStart(3);
        const price = `₦${item.price}`.padStart(6);
        const amount = `₦${(item.price * item.quantity)}`.padStart(7);
        const line = `${name} ${qty} ${price} ${amount}\n`;
        data = this.concatArrays(data, this.textToUint8Array(line));
      });

      data = this.concatArrays(data, this.textToUint8Array('--------------------------------\n'));

      // Totals
      data = this.concatArrays(data, this.textToUint8Array(`Subtotal: ₦${receiptData.subtotal}\n`));
      if (receiptData.discount > 0) {
        data = this.concatArrays(data, this.textToUint8Array(`Discount: ₦${receiptData.discount}\n`));
      }
      data = this.concatArrays(data, new Uint8Array(this.commands.BOLD_ON));
      data = this.concatArrays(data, this.textToUint8Array(`TOTAL: ₦${receiptData.total}\n`));
      data = this.concatArrays(data, new Uint8Array(this.commands.BOLD_OFF));

      data = this.concatArrays(data, this.textToUint8Array('\n'));
      data = this.concatArrays(data, new Uint8Array(this.commands.ALIGN_CENTER));
      data = this.concatArrays(data, this.textToUint8Array('Thank you for your patronage!\n'));
      data = this.concatArrays(data, this.textToUint8Array('POWERED BY T-TECH SOLUTIONS\n'));

      // Feed and cut paper
      data = this.concatArrays(data, new Uint8Array([0x1B, 0x64, 0x05])); // Feed 5 lines
      data = this.concatArrays(data, new Uint8Array(this.commands.CUT));

      // Send data to printer
      await this.device.transferOut(1, data);
      console.log('Receipt printed successfully via thermal printer');
      return true;
    } catch (error) {
      console.error('Failed to print receipt:', error);
      return false;
    }
  }

  private textToUint8Array(text: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  private concatArrays(a: Uint8Array, b: Uint8Array): Uint8Array {
    const result = new Uint8Array(a.length + b.length);
    result.set(a, 0);
    result.set(b, a.length);
    return result;
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await this.device.close();
        this.device = null;
        console.log('Thermal printer disconnected');
      } catch (error) {
        console.error('Error disconnecting printer:', error);
      }
    }
  }
}

export const thermalPrinterService = new ThermalPrinterService();
