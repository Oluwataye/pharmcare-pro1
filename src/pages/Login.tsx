
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema, validateAndSanitize } from "@/lib/validation";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const validateForm = () => {
    const validation = validateAndSanitize(loginSchema, { email, password });
    if (!validation.success) {
      // Parse validation errors
      const newErrors: { email?: string; password?: string } = {};
      if (validation.error?.includes('email')) {
        newErrors.email = validation.error;
      } else if (validation.error?.includes('Password')) {
        newErrors.password = validation.error;
      }
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoggingIn(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 md:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <h1 className="text-xl md:text-2xl font-bold text-center mb-6 text-primary">
            PharmaCare Pro
          </h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Demo Credentials:</h3>
            <div className="text-xs space-y-1">
              <div><strong>Admin:</strong> admin@demo.com / Admin123!</div>
              <div><strong>Pharmacist:</strong> pharmacist@demo.com / Pharmacist123!</div>
              <div><strong>Cashier:</strong> cashier@demo.com / Cashier123!</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                required
                className={`w-full ${errors.email ? 'border-red-500' : ''}`}
                disabled={isLoggingIn}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  required
                  className={`w-full pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  disabled={isLoggingIn}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Logging in...</span>
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
