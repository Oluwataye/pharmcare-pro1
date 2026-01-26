
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Truck, Phone, Mail, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSuppliers } from "@/hooks/useSuppliers";
import { AddSupplierDialog } from "../components/suppliers/AddSupplierDialog";
import { EditSupplierDialog } from "../components/suppliers/EditSupplierDialog";
import { DeleteSupplierDialog } from "../components/suppliers/DeleteSupplierDialog";
import { EnhancedCard } from "@/components/ui/EnhancedCard";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History } from "lucide-react";
import { SupplierHistory } from "@/components/suppliers/SupplierHistory";

const Suppliers = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const { suppliers, isLoading, fetchSuppliers } = useSuppliers();
    const { toast } = useToast();

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleRefresh = () => {
        fetchSuppliers();
    };

    return (
        <div className="p-4 md:p-6 space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Supplier Management</h1>
                    <p className="text-muted-foreground">Manage your product suppliers and contact information.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search suppliers..."
                            className="pl-8 w-full md:w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <AddSupplierDialog onSupplierAdded={handleRefresh} />
                </div>
            </div>

            <EnhancedCard colorScheme="primary" className="border-none shadow-none bg-transparent">
                <Tabs defaultValue="list" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="list" className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Suppliers List
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Delivery History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list">
                        <EnhancedCard colorScheme="primary">
                            <CardHeader className="p-4 md:p-6">
                                <CardTitle className="text-lg">Suppliers List</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <Spinner size="lg" />
                                        <p className="text-muted-foreground">Loading suppliers...</p>
                                    </div>
                                ) : (
                                    <div className="responsive-table">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Supplier Name</TableHead>
                                                    <TableHead className="hidden lg:table-cell">Contact Person</TableHead>
                                                    <TableHead>Contact Info</TableHead>
                                                    <TableHead className="hidden md:table-cell">Address</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredSuppliers.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-12">
                                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                                <p className="text-lg font-medium">No suppliers found</p>
                                                                <p className="text-muted-foreground">
                                                                    {searchTerm ? "Try adjusting your search" : "Click 'Add Supplier' to get started"}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredSuppliers.map((supplier) => (
                                                        <TableRow key={supplier.id} className="hover:bg-muted/50 transition-colors">
                                                            <TableCell className="font-semibold text-primary">
                                                                {supplier.name}
                                                            </TableCell>
                                                            <TableCell className="hidden lg:table-cell">
                                                                {supplier.contact_person || "-"}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    {supplier.phone && (
                                                                        <div className="flex items-center gap-2 text-sm">
                                                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                                                            <span>{supplier.phone}</span>
                                                                        </div>
                                                                    )}
                                                                    {supplier.email && (
                                                                        <div className="flex items-center gap-2 text-sm">
                                                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                                                            <span className="hover:text-primary transition-colors">{supplier.email}</span>
                                                                        </div>
                                                                    )}
                                                                    {!supplier.phone && !supplier.email && "-"}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                                                                {supplier.address || "-"}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-1">
                                                                    <EditSupplierDialog supplier={supplier} onSupplierUpdated={handleRefresh} />
                                                                    <DeleteSupplierDialog supplier={supplier} onSupplierDeleted={handleRefresh} />
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </EnhancedCard>
                    </TabsContent>

                    <TabsContent value="history">
                        <SupplierHistory />
                    </TabsContent>
                </Tabs>
            </EnhancedCard>
        </div>
    );
};

export default Suppliers;
