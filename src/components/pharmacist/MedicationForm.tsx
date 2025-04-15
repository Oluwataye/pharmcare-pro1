
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface MedicationFormProps {
  medication?: {
    id: number;
    name: string;
    category: string;
    stock: number;
    expiry: string;
    description?: string;
  };
  onComplete: (isNew: boolean) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().min(1, "Please select a category"),
  stock: z.coerce.number().int().positive("Stock must be a positive number"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  description: z.string().optional(),
  batchNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  dosage: z.string().optional(),
});

export function MedicationForm({ medication, onComplete, onCancel }: MedicationFormProps) {
  const isEdit = !!medication;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: medication?.name || "",
      category: medication?.category || "",
      stock: medication?.stock || 0,
      expiryDate: medication?.expiry || "",
      description: medication?.description || "",
      batchNumber: "",
      manufacturer: "",
      dosage: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Here you would normally send the data to your API
    console.log(values);
    onComplete(isEdit ? false : true);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medication Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter medication name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Analgesic">Analgesic</SelectItem>
                    <SelectItem value="Antibiotic">Antibiotic</SelectItem>
                    <SelectItem value="Antiviral">Antiviral</SelectItem>
                    <SelectItem value="Antihistamine">Antihistamine</SelectItem>
                    <SelectItem value="NSAID">NSAID</SelectItem>
                    <SelectItem value="Steroid">Steroid</SelectItem>
                    <SelectItem value="Supplement">Supplement</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="batchNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter batch number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manufacturer</FormLabel>
                <FormControl>
                  <Input placeholder="Enter manufacturer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dosage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dosage Information</FormLabel>
                <FormControl>
                  <Input placeholder="Enter dosage information" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter medication description, usage instructions, or additional notes"
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isEdit ? "Update" : "Add"} Medication
          </Button>
        </div>
      </form>
    </Form>
  );
}
