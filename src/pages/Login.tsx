
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Eye, EyeOff, Shield, AlertTriangle } from "lucide-react";
import { loginSchema, validateAndSanitize } from "@/lib/validation";
import { logSecurityEvent, getCSRFToken } from "@/components/security/SecurityProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      const newErrors: { email?: string; password?: string } = {};
      if (validation.error?.includes('email')) {
        newErrors.email = validation.error;
      } else if (validation.error?.includes('Password')) {
        newErrors.password = validation.error;
      }
      setErrors(newErrors);
      logSecurityEvent('FORM_VALIDATION_FAILED', { 
        email, 
        error: validation.error 
      });
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

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    // Basic input sanitization
    const sanitizedValue = value.replace(/[<>'"&]/g, '');
    
    if (field === 'email') {
      setEmail(sanitizedValue);
      if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
    } else {
      setPassword(sanitizedValue);
      if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 md:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-xl md:text-2xl font-bold text-primary">
              PharmaCare Pro
            </h1>
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
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                autoComplete="email"
                className={`w-full ${errors.email ? 'border-red-500' : ''}`}
                disabled={isLoggingIn}
                maxLength={100}
                placeholder="Enter your email"
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
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  autoComplete="current-password"
                  className={`w-full pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  disabled={isLoggingIn}
                  maxLength={128}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoggingIn}
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
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoggingIn}
            >
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

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs font-medium text-amber-800 mb-1">Password Requirements:</p>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Contains uppercase letter (A-Z)</li>
              <li>• Contains lowercase letter (a-z)</li>
              <li>• Contains number (0-9)</li>
              <li>• Contains special character (!@#$%^&*)</li>
            </ul>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            <Shield className="h-3 w-3 inline mr-1" />
            Your session is protected with enhanced security measures
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
