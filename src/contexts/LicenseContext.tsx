import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from '@/lib/secureStorage';

interface LicenseState {
  isValid: boolean;
  isLoading: boolean;
  isActivated: boolean;
  clientName: string | null;
  checkLicense: () => Promise<boolean>;
  activateLicense: (key: string, clientName: string) => Promise<{success: boolean; error?: string}>;
}

const LicenseContext = createContext<LicenseState | undefined>(undefined);

// Generate or retrieve a persistent client-side installation footprint
const getInstallationFootprint = () => {
  let installId = secureStorage.getItem('system_install_id');
  if (!installId) {
    installId = crypto.randomUUID();
    secureStorage.setItem('system_install_id', installId);
  }
  return {
    installationId: installId,
    domain: window.location.hostname
  };
};

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isValid, setIsValid] = useState<boolean>(true); // Optimistic initially
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [clientName, setClientName] = useState<string | null>(null);

  const checkLicense = async () => {
    try {
      if (!window.navigator.onLine) {
        // Optimistically trust offline secureStorage if previously verified within 7 days
        const lastVerification = secureStorage.getItem('license_last_verified');
        const _isValid = secureStorage.getItem('license_is_valid') === true;
        
        if (_isValid && lastVerification) {
           const daysSinceVerify = (Date.now() - new Date(lastVerification).getTime()) / (1000 * 3600 * 24);
           if (daysSinceVerify < 7) {
              setIsValid(true);
              setIsActivated(true);
              setClientName(secureStorage.getItem('license_client_name'));
              return true;
           }
        }
      }

      // Check active licenses generically directly from table (No RLS block for SELECT)
      const { data: licenses, error } = await supabase
        .from('system_license' as any)
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      if (!licenses || licenses.length === 0) {
        setIsValid(false);
        setIsActivated(false);
        secureStorage.setItem('license_is_valid', false);
        return false;
      }

      const activeLicense = licenses[0] as any;
      
      // We must verify the payload footprints against Edge Function
      const footprint = getInstallationFootprint();
      
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('activate-license', {
        body: {
          action: 'verify',
          licenseKey: activeLicense.license_key,
          domain: footprint.domain,
          installationId: footprint.installationId
        }
      });

      if (verifyError || !verifyData?.valid) {
        console.warn('License validation failed:', verifyData?.reason || verifyError?.message);
        setIsValid(false);
        setIsActivated(false);
        secureStorage.setItem('license_is_valid', false);
        return false;
      }

      setIsValid(true);
      setIsActivated(true);
      setClientName(verifyData.clientName);
      
      secureStorage.setItem('license_is_valid', true);
      secureStorage.setItem('license_last_verified', new Date().toISOString());
      secureStorage.setItem('license_client_name', verifyData.clientName);
      
      return true;

    } catch (err) {
      console.error('License check error:', err);
      // In case of total failure, fail closed unless offline override applies
      setIsValid(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const activateLicense = async (key: string, name: string) => {
    try {
      setIsLoading(true);
      const footprint = getInstallationFootprint();
      
      const { data, error } = await supabase.functions.invoke('activate-license', {
        body: {
          action: 'activate',
          licenseKey: key,
          clientName: name,
          domain: footprint.domain,
          installationId: footprint.installationId
        }
      });

      if (error) {
         return { success: false, error: error.message };
      }

      if (data.error) {
         return { success: false, error: data.error };
      }

      await checkLicense();
      return { success: true };
    } catch (err: any) {
      console.error('Activation error:', err);
      return { success: false, error: err.message || 'Verification failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkLicense();
  }, []);

  return (
    <LicenseContext.Provider value={{ isValid, isLoading, isActivated, clientName, checkLicense, activateLicense }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};
