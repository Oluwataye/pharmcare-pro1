
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSuppliers } from "@/hooks/useSuppliers";
import { NewSupplier } from "@/types/supplier";

interface AddSupplierDialogProps {
    onSupplierAdded?: () => void;
}

export const AddSupplierDialog = ({ onSupplierAdded }: AddSupplierDialogProps) => {
    const [open, setOpen] = useState(false);
    const { addSupplier, isLoading } = useSuppliers();

    const form = useForm<NewSupplier>({
        defaultValues: {
            name: "",
            contact_person: "",
            phone: "",
            email: "",
            address: "",
            notes: "",
        },
    });

    const onSubmit = async (values: NewSupplier) => {
        const success = await addSupplier(values);
        if (success) {
            setOpen(false);
            form.reset();
            if (onSupplierAdded) {
                onSupplierAdded();
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Supplier
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Supplier</DialogTitle>
                    <DialogDescription>
                        Enter the details of the new supplier below.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            rules={{ required: "Supplier name is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Supplier Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter supplier name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="contact_person"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Person</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Person to contact" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Primary phone" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="Email address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Physical address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Additional information" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Adding..." : "Add Supplier"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
