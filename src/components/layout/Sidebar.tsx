import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/", roles: ["ADMIN", "PHARMACIST"] },
    { icon: Package, label: "Inventory", path: "/inventory", roles: ["ADMIN", "PHARMACIST"] },
    { icon: ShoppingCart, label: "Sales", path: "/sales", roles: ["ADMIN", "PHARMACIST"] },
    { icon: Users, label: "Users", path: "/users", roles: ["ADMIN"] },
    { icon: Settings, label: "Settings", path: "/settings", roles: ["ADMIN", "PHARMACIST"] },
    { icon: ShoppingCart, label: "Cashier Dashboard", path: "/cashier", roles: ["CASHIER"] },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r">
      <div className="p-4">
        <h1 className="text-xl font-bold text-primary">PharmaCare Pro</h1>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => {
          if (!item.roles.includes(user?.role || "")) return null;
          
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
    </div>
  );
};

export default Sidebar;