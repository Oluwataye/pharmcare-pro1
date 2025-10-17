import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  FileText,
  ChevronLeft,
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const {
    canAccessInventory,
    canAccessUsers,
    canAccessReports,
  } = usePermissions();
  const [storeLogo, setStoreLogo] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('PharmCare Pro');

  useEffect(() => {
    fetchStoreLogo();
  }, []);

  const fetchStoreLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('logo_url, name')
        .single();

      if (error) throw error;

      if (data) {
        setStoreLogo(data.logo_url || '');
        setStoreName(data.name || 'PharmCare Pro');
      }
    } catch (error) {
      console.error('Error fetching store logo:', error);
    }
  };

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
      // Only show Inventory for users with proper permissions
      condition: canAccessInventory()
    },
    { 
      icon: ShoppingCart, 
      label: "Sales", 
      path: "/sales",
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
      condition: true
    },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-full md:h-screen w-full md:w-64 flex-col bg-white border-r">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3 flex-1">
          {storeLogo ? (
            <div className="w-10 h-10 rounded-md overflow-hidden border border-border flex-shrink-0">
              <img
                src={storeLogo}
                alt="Store Logo"
                className="w-full h-full object-contain bg-muted"
              />
            </div>
          ) : null}
          <h1 className="text-lg font-bold text-primary truncate">
            {storeName}
          </h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="md:hidden flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      {user && (
        <div className="px-4">
          <p className="text-sm text-muted-foreground">
            {user.role} ({user.name})
          </p>
        </div>
      )}

      <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
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
              onClick={() => handleNavigate(item.path)}
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
