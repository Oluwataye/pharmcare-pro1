
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useState, useEffect } from "react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { OfflineSyncIndicator } from "./OfflineSyncIndicator";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  FileText,
  ChevronLeft,
  Receipt,
  Printer,
  Truck,
  Clock,
  Wallet,
  CheckCircle2,
  GraduationCap,
  Banknote
} from "lucide-react";
import { NairaSign } from "@/components/icons/NairaSign";

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
    canAccessShifts,
    canAccessSuppliers,
    canAccessExpenses,
    canAccessTraining,
    canAccessCredit,
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

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Sales: true // Default sales to expanded if active
  });

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
      icon: ShoppingBag,
      label: "Sales",
      path: "/sales",
      condition: true,
      children: [
        {
          icon: ShoppingBag,
          label: "Point of Sale",
          path: "/sales"
        },
        {
          icon: Receipt,
          label: "Receipts",
          path: "/sales/receipts"
        },
        {
          icon: Printer,
          label: "Print History",
          path: "/sales/history",
          condition: canAccessReports()
        },
        {
          icon: NairaSign,
          label: "Refunds",
          path: "/sales/refunds",
          condition: canAccessReports()
        },
      ]
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
      icon: CheckCircle2,
      label: "Cash Reconciliation",
      path: "/cash-reconciliation",
      condition: canAccessReports()
    },
    {
      icon: Clock,
      label: "Staff Shifts",
      path: "/shifts",
      condition: canAccessShifts()
    },
    {
      icon: Truck,
      label: "Suppliers",
      path: "/suppliers",
      condition: canAccessSuppliers()
    },
    {
      icon: Wallet,
      label: "Expenses",
      path: "/expenses",
      condition: canAccessExpenses()
    },
    {
      icon: Banknote,
      label: "Credit Manager",
      path: "/credit",
      condition: canAccessCredit()
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/settings",
      condition: true
    },
    {
      icon: GraduationCap,
      label: "Training Guide",
      path: "/training",
      condition: canAccessTraining()
    },
  ];

  // Auto-expand menu if a child is active
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child =>
          location.pathname === child.path || location.pathname.startsWith(child.path + "/")
        );
        if (isChildActive) {
          setExpandedMenus(prev => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

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

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {menuItems.map((item) => {
          if (!item.condition) return null;

          // Highlight parent if we are in a sub-path (except for Dashboard '/')
          const isActive = item.path === "/"
            ? location.pathname === "/"
            : location.pathname === item.path || location.pathname.startsWith(item.path + "/");

          return (
            <Button
              key={item.path}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11 px-4 transition-all duration-200",
                isActive
                  ? "bg-[#002B5B] text-[#F3F4F6] shadow-md hover:bg-[#001D3D] border-l-4 border-[#3B82F6]"
                  : "hover:bg-accent/50 hover:translate-x-1 border-l-4 border-transparent"
              )}
              onClick={() => handleNavigate(item.path)}
            >
              <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-[#3B82F6]" : "text-muted-foreground")} />
              <span className={cn("font-medium", isActive && "font-semibold")}>{item.label}</span>
            </Button>
          );
        })}
      </nav>

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

      <div className="p-3 border-t flex items-center justify-between bg-card/30">
        <OfflineSyncIndicator />
        <p className="text-xs text-muted-foreground">© T-Tech</p>
      </div>
    </div>
  );
};

export default Sidebar;
