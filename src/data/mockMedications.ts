
export interface Medication {
  id: number;
  name: string;
  category: string;
  stock: number;
  expiry: string;
  status: "In Stock" | "Low Stock" | "Critical";
}

export const medications: Medication[] = [
  {
    id: 1,
    name: "Paracetamol",
    category: "Analgesic",
    stock: 100,
    expiry: "2024-12-15",
    status: "In Stock",
  },
  {
    id: 2,
    name: "Amoxicillin",
    category: "Antibiotic",
    stock: 20,
    expiry: "2024-08-30",
    status: "Low Stock",
  },
  {
    id: 3,
    name: "Vitamin C",
    category: "Supplement",
    stock: 75,
    expiry: "2025-03-10",
    status: "In Stock",
  },
  {
    id: 4,
    name: "Hydrocortisone Cream",
    category: "Steroid",
    stock: 15,
    expiry: "2024-06-22",
    status: "Low Stock",
  },
  {
    id: 5,
    name: "Ibuprofen",
    category: "NSAID",
    stock: 5,
    expiry: "2024-09-18",
    status: "Critical",
  },
];
