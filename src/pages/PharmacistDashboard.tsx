
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Package, AlertTriangle, TestTube, Calendar, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MedicationForm } from "@/components/pharmacist/MedicationForm";
import { Badge } from "@/components/ui/badge";

const PharmacistDashboard = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMedicationForm, setShowMedicationForm] = useState(false);

  const medications = [
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

  const filteredMedications = medications.filter(
    med => 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = medications.filter(med => med.status === "Low Stock").length;
  const criticalStockCount = medications.filter(med => med.status === "Critical").length;
  const expiringSoonCount = 3; // Mock data for medications expiring within 30 days

  const handleMedicationComplete = (isNew: boolean) => {
    toast({
      title: isNew ? "Medication Added" : "Medication Updated",
      description: isNew ? "The medication was added successfully" : "The medication was updated successfully",
    });
    setShowMedicationForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">Pharmacist Dashboard</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search medications..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowMedicationForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Medication
          </Button>
        </div>
      </div>

      {showMedicationForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Add New Medication</CardTitle>
          </CardHeader>
          <CardContent>
            <MedicationForm onComplete={(isNew) => handleMedicationComplete(isNew)} onCancel={() => setShowMedicationForm(false)} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Medications</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{medications.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{criticalStockCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expiringSoonCount}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medication Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No medications found</TableCell>
                    </TableRow>
                  ) : (
                    filteredMedications.map((medication) => (
                      <TableRow key={medication.id}>
                        <TableCell>{medication.name}</TableCell>
                        <TableCell>{medication.category}</TableCell>
                        <TableCell>{medication.stock}</TableCell>
                        <TableCell>{medication.expiry}</TableCell>
                        <TableCell>
                          <Badge variant={
                            medication.status === "In Stock" 
                              ? "default" 
                              : medication.status === "Low Stock" 
                                ? "outline" 
                                : "destructive"
                          }>
                            {medication.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                toast({
                                  title: "Not Implemented",
                                  description: "Edit functionality would be implemented here",
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                toast({
                                  title: "Not Implemented",
                                  description: "View details functionality would be implemented here",
                                });
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default PharmacistDashboard;
