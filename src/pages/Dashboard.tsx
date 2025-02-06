import { useAuth } from "@/contexts/AuthContext";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import PharmacistDashboard from "@/components/dashboard/PharmacistDashboard";
import CashierDashboard from "@/components/dashboard/CashierDashboard";

const Dashboard = () => {
  const { user } = useAuth();

  const getRoleTitle = () => {
    switch (user?.role) {
      case 'ADMIN':
        return "Admin Dashboard";
      case 'PHARMACIST':
        return "Pharmacy Management";
      case 'CASHIER':
        return "Sales Dashboard";
      default:
        return "Dashboard";
    }
  };

  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'PHARMACIST':
        return <PharmacistDashboard />;
      case 'CASHIER':
        return <CashierDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{getRoleTitle()}</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}
        </p>
      </div>
      {getDashboardComponent()}
    </div>
  );
};

export default Dashboard;