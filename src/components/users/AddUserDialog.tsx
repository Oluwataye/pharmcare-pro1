
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, UserRole } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Info } from "lucide-react";
import { passwordSchema } from "@/lib/validation";

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: passwordSchema,
  role: z.enum(["SUPER_ADMIN", "PHARMACIST", "CASHIER"] as const),
});

type UserFormValues = z.infer<typeof userSchema>;

interface AddUserDialogProps {
  onUserAdded: (user: User) => void;
}

export function AddUserDialog({ onUserAdded }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { canManageUsers } = usePermissions();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      role: "CASHIER",
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    if (!canManageUsers()) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create users.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("You must be logged in to create users");
      }

      const { data: result, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
          username: data.username || null,
          role: data.role
        }
      });

      if (error) throw error;

      // Fetch the complete user data including profile and role
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, user_id, name, username')
        .eq('user_id', result.user.id)
        .single();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', result.user.id)
        .single();

      const newUser: User = {
        id: result.user.id,
        name: profile?.name || data.name,
        email: data.email,
        username: profile?.username || data.username || undefined,
        role: (roleData?.role as UserRole) || data.role as UserRole,
      };
      
      onUserAdded(newUser);
      
      toast({
        title: "Success",
        description: "User has been created successfully",
      });
      
      setOpen(false);
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create user. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormDescription>
                    Choose a unique username for the user
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs space-y-1">
                    <div className="flex items-start gap-1 mt-1">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <div>Must contain:</div>
                        <div>• 8+ characters</div>
                        <div>• Uppercase (A-Z)</div>
                        <div>• Lowercase (a-z)</div>
                        <div>• Number (0-9)</div>
                        <div>• Special (!@#$%^&*)</div>
                      </div>
                    </div>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                      <SelectItem value="CASHIER">Cashier</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
