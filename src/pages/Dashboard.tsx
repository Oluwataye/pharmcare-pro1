import { useAuth } from "@/contexts/AuthContext";
import DispenserDashboard from "./DispenserDashboard";
import PharmacistDashboard from "./PharmacistDashboard";
import AdminDashboardContent from "@/components/admin/AdminDashboardContent";
import { useInventoryAlerts } from "@/hooks/useInventoryAlerts";

const Dashboard = () => {
  const { user } = useAuth();

  // Trigger inventory alert notifications
  useInventoryAlerts();

  if (!user) {
    return <div>Loading...</div>;
  }

  switch (user.role) {
    case "DISPENSER":
      return <DispenserDashboard />;
    case "PHARMACIST":
      return <PharmacistDashboard />;
    case "SUPER_ADMIN":
    default:
      return <AdminDashboardContent />;
  }
};

export default Dashboard;

