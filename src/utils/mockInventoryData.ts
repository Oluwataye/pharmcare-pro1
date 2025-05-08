
import { InventoryItem } from "../types/inventory";

// Mock data - replace with actual API calls later
export const mockInventory: InventoryItem[] = [
  {
    id: "1",
    name: "Paracetamol",
    sku: "PCM001",
    category: "Pain Relief",
    quantity: 150,
    unit: "tablets",
    price: 500,
    reorderLevel: 30,
    expiryDate: "2026-01-15",
    manufacturer: "Emzor Pharmaceuticals",
    batchNumber: "PCM2023-001",
    lastUpdatedBy: "admin",
    lastUpdatedAt: new Date("2025-01-15").toISOString(),
  },
  {
    id: "2",
    name: "Amoxicillin",
    sku: "AMX002",
    category: "Antibiotics",
    quantity: 80,
    unit: "capsules",
    price: 1200,
    reorderLevel: 20,
    expiryDate: "2025-08-10",
    manufacturer: "GSK",
    batchNumber: "AMX2023-002",
    lastUpdatedBy: "pharmacist1",
    lastUpdatedAt: new Date("2025-02-10").toISOString(),
  },
];
