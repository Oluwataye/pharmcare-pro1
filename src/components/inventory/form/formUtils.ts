export const getDefaultExpiryDate = (): string => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 2);
  return date.toISOString().split('T')[0];
};

export const UNIT_OPTIONS = [
  { value: "tablets", label: "Tablets" },
  { value: "capsules", label: "Capsules" },
  { value: "card", label: "Card" },
  { value: "sachet", label: "Sachet" },
  { value: "pcs", label: "Pcs" },
  { value: "pack", label: "Pack" },
  { value: "box", label: "Box" },
  { value: "boxes", label: "Boxes" },
  { value: "carton", label: "Carton" },
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "l", label: "L" },
  { value: "ml", label: "ml" },
  { value: "mg", label: "mg" },
  { value: "bottle", label: "Bottle" },
  { value: "bottles", label: "Bottles" },
  { value: "bag", label: "Bag" },
  { value: "roll", label: "Roll" },
  { value: "vials", label: "Vials" },
  { value: "units", label: "Units" }
];

export const initialInventoryFormState = {
  name: "",
  sku: "",
  category: "",
  quantity: 0,
  unit: "units",
  price: 0,
  costPrice: 0,
  profitMargin: 20, // Default to 20%
  reorderLevel: 0,
  expiryDate: getDefaultExpiryDate(),
  manufacturer: "",
  batchNumber: "",
  supplierId: "none",
  restockInvoiceNumber: "",
};
