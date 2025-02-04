import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MenuItem } from "@/lib/types";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getBasePath = () => {
    switch (user?.role) {
      case 'ADMIN':
        return '/admin';
      case 'PHARMACIST':
        return '/pharm';
      case 'CASHIER':
        return '/cashier';
      default:
        return '/login';
    }
  };

  const menuItems: MenuItem[] = [
    { 
      icon: LayoutDashboard, 
      label: "Dashboard", 
      path: `${getBasePath()}`, 
      roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] 
    },
    { 
      icon: Package, 
      label: "Inventory", 
      path: `${getBasePath()}/inventory`, 
      roles: ['ADMIN', 'PHARMACIST'] 
    },
    { 
      icon: ShoppingCart, 
      label: "Sales", 
      path: `${getBasePath()}/sales`, 
      roles: ['ADMIN', 'CASHIER'] 
    },
    { 
      icon: Users, 
      label: "Users", 
      path: `${getBasePath()}/users`, 
      roles: ['ADMIN'] 
    },
    { 
      icon: Settings, 
      label: "Settings", 
      path: `${getBasePath()}/settings`, 
      roles: ['ADMIN'] 
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredMenuItems = menuItems.filter(item => 
    user?.role ? item.roles.includes(user.role) : false
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white">
      <div className="p-4">
        <h1 className="text-xl font-bold text-primary">PharmaCare Pro</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Logged in as {user?.role.toLowerCase()}
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2",
                isActive && "bg-primary/10"
              )}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setIsOpen(false);
              }}
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

  if (isMobile) {
    return (
      <>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden fixed top-4 left-4 z-50"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <div className="hidden md:block h-screen w-64 border-r">
      <SidebarContent />
    </div>
  );
};

export default Sidebar;