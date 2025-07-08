
import { useAuth } from "@/contexts/AuthContext";
import CashierDashboard from "./CashierDashboard";
import PharmacistDashboard from "./PharmacistDashboard";
import AdminDashboardContent from "@/components/admin/AdminDashboardContent";

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  switch (user.role) {
    case "CASHIER":
      return <CashierDashboard />;
    case "PHARMACIST":
      return <PharmacistDashboard />;
    case "SUPER_ADMIN":
    default:
      return <AdminDashboardContent />;
  }
};

export default Dashboard;

