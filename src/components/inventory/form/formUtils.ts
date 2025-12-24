
export const UNIT_OPTIONS = [
  { value: "tablets", label: "Tablets" },
  { value: "capsules", label: "Capsules" },
  { value: "bottles", label: "Bottles" },
  { value: "vials", label: "Vials" },
  { value: "boxes", label: "Boxes" },
  { value: "units", label: "Units" },
  { value: "ml", label: "ml" },
  { value: "l", label: "l" },
  { value: "mg", label: "mg" },
  { value: "g", label: "g" }
];

export const initialInventoryFormState = {
  name: "",
  sku: "",
  category: "",
  quantity: 0,
  unit: "units",
  price: 0,
  reorderLevel: 0,
  expiryDate: "",
  manufacturer: "",
  batchNumber: "",
};
