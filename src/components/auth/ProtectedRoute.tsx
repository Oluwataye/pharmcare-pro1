
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Permission } from "@/lib/types";
import { usePermissions } from "@/hooks/usePermissions";
import { useLicense } from "@/contexts/LicenseContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isValid: isLicenseValid, isLoading: isLicenseLoading } = useLicense();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  if (isAuthLoading || isLicenseLoading) {
    return <div>Loading...</div>;
  }

  // Enforce License Strict Check
  if (!isLicenseValid) {
    // We do not want to block access to the license activation page itself, though this is handled in App.tsx routing
    return <Navigate to="/license-activation" state={{ from: location }} replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
