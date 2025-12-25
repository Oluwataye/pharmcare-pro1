import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { OfflineSyncIndicator } from "./OfflineSyncIndicator";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  FileText,
  ChevronLeft,
  Receipt,
  Printer,
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
  const { settings: storeSettings } = useStoreSettings();
  const [storeLogo, setStoreLogo] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('PharmCare Pro');

  useEffect(() => {
    if (storeSettings) {
      setStoreLogo(storeSettings.logo_url || '');
      setStoreName(storeSettings.name || 'PharmCare Pro');
    }
  }, [storeSettings]);

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
      icon: Receipt,
      label: "Receipts",
      path: "/receipts",
      condition: true
    },
    {
      icon: Printer,
      label: "Print History",
      path: "/print-history",
      condition: canAccessReports()
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
    <div className="flex h-full md:h-screen w-full md:w-64 flex-col bg-gradient-to-b from-background to-muted/30 border-r shadow-sm">
      {/* Header with Logo and Store Name */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3 flex-1">
          {storeLogo ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-primary/20 flex-shrink-0 shadow-sm">
              <img
                src={storeLogo}
                alt="Store Logo"
                className="w-full h-full object-contain bg-white p-1"
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
          className="md:hidden flex-shrink-0 hover:bg-primary/10"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="px-4 py-4 border-b bg-card/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
              <span className="text-sm font-semibold text-primary">
                {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role.toLowerCase().replace('_', ' ')}
              </p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="Online" />
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {menuItems.map((item) => {
          if (!item.condition) return null;

          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11 px-4 transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 border-l-4 border-primary"
                  : "hover:bg-accent/50 hover:translate-x-1 border-l-4 border-transparent"
              )}
              onClick={() => handleNavigate(item.path)}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              <span className={cn("font-medium", isActive && "font-semibold")}>{item.label}</span>
            </Button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t bg-card/50">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 px-4 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>

      {/* Sync Indicator & Footer */}
      <div className="p-3 border-t flex items-center justify-between bg-card/30">
        <OfflineSyncIndicator />
        <p className="text-xs text-muted-foreground">© T-Tech</p>
      </div>
    </div>
  );
};

export default Sidebar;
