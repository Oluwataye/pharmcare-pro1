
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UserCog } from "lucide-react";
import { Permission, ROLE_PERMISSIONS, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface UserPermissionsDialogProps {
  user: User;
}

export function UserPermissionsDialog({ user }: UserPermissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Get the default permissions for this user's role
  const defaultPermissions = ROLE_PERMISSIONS[user.role];
  
  // Track selected permissions
  const [permissions, setPermissions] = useState<Permission[]>(defaultPermissions);

  const resources = ["inventory", "sales", "users", "settings", "reports"];
  const actions = ["create", "read", "update", "delete"];

  const hasPermission = (action: string, resource: string) => {
    return permissions.some(
      (p) => p.action === action && p.resource === resource
    );
  };

  const togglePermission = (action: "create" | "read" | "update" | "delete", resource: "inventory" | "sales" | "users" | "settings" | "reports") => {
    const exists = permissions.some(
      (p) => p.action === action && p.resource === resource
    );

    if (exists) {
      setPermissions(permissions.filter(
        (p) => !(p.action === action && p.resource === resource)
      ));
    } else {
      setPermissions([...permissions, { action, resource }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real app, this would make an API call to update the user's permissions
      // Simulating API call with timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Permissions updated",
        description: `Permissions for ${user.name} have been updated successfully.`,
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Manage User Permissions">
          <UserCog className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Permissions for {user.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="py-4">
          <div className="grid grid-cols-[120px_1fr] gap-4">
            <div></div>
            <div className="grid grid-cols-4 gap-4">
              {actions.map(action => (
                <div key={action} className="text-center font-medium text-sm capitalize">
                  {action}
                </div>
              ))}
            </div>
            
            {resources.map(resource => (
              <React.Fragment key={resource}>
                <div className="font-medium text-sm capitalize">{resource}</div>
                <div className="grid grid-cols-4 gap-4">
                  {actions.map(action => (
                    <div key={`${resource}-${action}`} className="flex justify-center">
                      <Checkbox 
                        id={`${resource}-${action}`}
                        checked={hasPermission(action, resource)}
                        onCheckedChange={() => togglePermission(
                          action as "create" | "read" | "update" | "delete", 
                          resource as "inventory" | "sales" | "users" | "settings" | "reports"
                        )}
                      />
                    </div>
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Permissions"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
