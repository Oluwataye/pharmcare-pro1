
import React, { useEffect } from 'react';

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  useEffect(() => {
    // Add security-related meta tags and headers that can be set from client-side
    const addSecurityMeta = () => {
      // Check if we're in a secure context
      if (typeof window !== 'undefined') {
        // Disable right-click context menu for sensitive data protection
        const handleContextMenu = (e: MouseEvent) => {
          if (process.env.NODE_ENV === 'production') {
            e.preventDefault();
          }
        };

        // Disable text selection for sensitive areas
        const handleSelectStart = (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains('sensitive-data')) {
            e.preventDefault();
          }
        };

        // Add security event listeners
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('selectstart', handleSelectStart);

        // Cleanup function
        return () => {
          document.removeEventListener('contextmenu', handleContextMenu);
          document.removeEventListener('selectstart', handleSelectStart);
        };
      }
    };

    const cleanup = addSecurityMeta();

    // Set security headers that can be controlled from client-side
    if (typeof document !== 'undefined') {
      // Add referrer policy
      let referrerMeta = document.querySelector('meta[name="referrer"]');
      if (!referrerMeta) {
        referrerMeta = document.createElement('meta');
        referrerMeta.setAttribute('name', 'referrer');
        referrerMeta.setAttribute('content', 'strict-origin-when-cross-origin');
        document.head.appendChild(referrerMeta);
      }

      // Add robots meta for sensitive pages
      let robotsMeta = document.querySelector('meta[name="robots"]');
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        robotsMeta.setAttribute('content', 'noindex, nofollow, nosnippet, noarchive');
        document.head.appendChild(robotsMeta);
      }
    }

    return cleanup;
  }, []);

  return <>{children}</>;
};

// Security utility functions
export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

export const isSecureContext = (): boolean => {
  return typeof window !== 'undefined' && (
    window.isSecureContext || 
    location.protocol === 'https:' || 
    location.hostname === 'localhost'
  );
};

export const logSecurityEvent = (event: string, details?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Security Event: ${event}`, details);
  }
  // In production, this would send to a security monitoring service
};
