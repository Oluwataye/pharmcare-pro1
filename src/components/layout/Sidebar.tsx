
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  FileText,
} from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const {
    canAccessInventory,
    canManageInventory,
    canAccessUsers,
    canAccessReports,
  } = usePermissions();

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: "Dashboard", 
      path: "/",
      condition: true 
    },
    { 
      icon: Package, 
      label: "Inventory", 
      path: "/inventory",
      condition: canAccessInventory()
    },
    { 
      icon: ShoppingCart, 
      label: "Sales", 
      path: "/sales",
      // All users can now access sales
      condition: true
    },
    { 
      icon: Users, 
      label: "Users", 
      path: "/users",
      condition: canAccessUsers()
    },
    { 
      icon: FileText, 
      label: "Reports", 
      path: "/reports",
      condition: canAccessReports()
    },
    { 
      icon: Settings, 
      label: "Settings", 
      path: "/settings",
      condition: true // All users can access settings, but their view will be restricted
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r">
      <div className="p-4">
        <h1 className="text-xl font-bold text-primary">PharmaCare Pro</h1>
        {user && (
          <>
            <p className="text-sm text-muted-foreground mt-1">
              {user.role} ({user.name})
            </p>
          </>
        )}
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => {
          if (!item.condition) return null;
          
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2",
                isActive && "bg-primary/10"
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
      
      <div className="p-4 border-t text-xs text-muted-foreground text-center">
        2025 © T-Tech Solutions
      </div>
    </div>
  );
};

export default Sidebar;
