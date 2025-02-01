import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getHomePage = () => {
    switch (user?.role) {
      case 'PHARMACIST':
        return '/inventory';
      case 'CASHIER':
        return '/sales';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6 py-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-red-600 mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 text-center mb-6">
          You don't have permission to access this page.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate(getHomePage())}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;