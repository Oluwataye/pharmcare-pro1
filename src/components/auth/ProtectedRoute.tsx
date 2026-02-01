
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Permission } from "@/lib/types";
import { usePermissions } from "@/hooks/usePermissions";
import { MFAVerification } from "@/components/auth/MFAVerification";
import { MFAEnrollment } from "@/components/auth/MFAEnrollment";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, mfaRequired, mfaEnrollmentRequired, verifyMFA } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Handle MFA Requirement
  if (mfaRequired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-4 animate-in fade-in zoom-in duration-300">
          <MFAVerification
            onVerify={async (code) => {
              try {
                await verifyMFA(code);
                return true;
              } catch (e) {
                return false;
              }
            }}
            title="Two-Factor Authentication Required"
            description="Your account is protected with 2FA. Please enter the code from your authenticator app."
          />
        </div>
      </div>
    );
  }

  // Handle mandatory MFA Enrollment
  if (mfaEnrollmentRequired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <MFAEnrollment
          onComplete={() => {
            // After successful enrollment, we might need to refresh state or just reload
            window.location.reload();
          }}
          onCancel={() => {
            // If they cancel a mandatory enrollment, they can't proceed
            window.location.href = '/login';
          }}
        />
      </div>
    );
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
