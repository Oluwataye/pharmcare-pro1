
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
import { Search, Package, AlertTriangle, Calendar, Plus, TestTube, PlusCircle, RefreshCw } from "lucide-react";
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Pharmacist Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage medications and inventory</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search medications..." 
              className="pl-8 w-[200px] md:w-[300px] transition-all" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowMedicationForm(true)} className="bg-primary hover:bg-primary/90 transition-colors">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Medication
          </Button>
        </div>
      </div>

      {showMedicationForm ? (
        <Card className="border-2 border-primary/10">
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
            <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Medications</CardTitle>
                <TestTube className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{medications.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total inventory items
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockCount}</div>
                <p className="text-xs text-muted-foreground">
                  Need attention soon
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{criticalStockCount}</div>
                <p className="text-xs text-muted-foreground">
                  Require immediate restock
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expiringSoonCount}</div>
                <p className="text-xs text-muted-foreground">
                  Within next 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Medication Inventory
              </CardTitle>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-muted/50">
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
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No medications found matching your search
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMedications.map((medication) => (
                      <TableRow key={medication.id} className="hover:bg-muted/50 cursor-pointer">
                        <TableCell className="font-medium">{medication.name}</TableCell>
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
                          } className="font-medium">
                            {medication.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 px-3 text-xs hover:bg-muted/80" 
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
                              className="h-8 px-3 text-xs hover:bg-muted/80" 
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
