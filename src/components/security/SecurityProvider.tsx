import React, { useEffect } from 'react';

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  useEffect(() => {
    // Add comprehensive security measures
    const addSecurityMeasures = () => {
      if (typeof window !== 'undefined') {
        // CSRF Token generation and storage
        const generateCSRFToken = () => {
          const token = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem('csrf_token', token);
          return token;
        };

        // Generate CSRF token if not exists
        if (!sessionStorage.getItem('csrf_token')) {
          generateCSRFToken();
        }

        // Disable right-click context menu in production for sensitive data protection
        const handleContextMenu = (e: MouseEvent) => {
          if (process.env.NODE_ENV === 'production') {
            const target = e.target as HTMLElement;
            if (target.classList.contains('sensitive-data') || 
                target.closest('.sensitive-data')) {
              e.preventDefault();
            }
          }
        };

        // Disable text selection for sensitive areas
        const handleSelectStart = (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains('sensitive-data') || 
              target.closest('.sensitive-data')) {
            e.preventDefault();
          }
        };

        // Prevent drag and drop of sensitive content
        const handleDragStart = (e: DragEvent) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains('sensitive-data') || 
              target.closest('.sensitive-data')) {
            e.preventDefault();
          }
        };

        // Monitor for suspicious activity
        const handleKeyDown = (e: KeyboardEvent) => {
          // Detect common inspection shortcuts
          if ((e.ctrlKey || e.metaKey) && 
              (e.key === 'u' || e.key === 'U' || 
               e.key === 'i' || e.key === 'I' ||
               e.key === 'j' || e.key === 'J')) {
            if (process.env.NODE_ENV === 'production') {
              logSecurityEvent('INSPECTION_ATTEMPT', { 
                key: e.key, 
                timestamp: new Date().toISOString() 
              });
            }
          }
        };

        // Add all event listeners
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('selectstart', handleSelectStart);
        document.addEventListener('dragstart', handleDragStart);
        document.addEventListener('keydown', handleKeyDown);

        // Monitor for console access attempts
        if (process.env.NODE_ENV === 'production') {
          let devtools = false;
          const detector = setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || 
                window.outerWidth - window.innerWidth > 200) {
              if (!devtools) {
                devtools = true;
                logSecurityEvent('DEVTOOLS_DETECTED', { 
                  timestamp: new Date().toISOString() 
                });
              }
            } else {
              devtools = false;
            }
          }, 1000);

          // Cleanup function
          return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('selectstart', handleSelectStart);
            document.removeEventListener('dragstart', handleDragStart);
            document.removeEventListener('keydown', handleKeyDown);
            clearInterval(detector);
          };
        }

        // Cleanup function for development
        return () => {
          document.removeEventListener('contextmenu', handleContextMenu);
          document.removeEventListener('selectstart', handleSelectStart);
          document.removeEventListener('dragstart', handleDragStart);
          document.removeEventListener('keydown', handleKeyDown);
        };
      }
    };

    const cleanup = addSecurityMeasures();

    // Set enhanced security headers and meta tags
    if (typeof document !== 'undefined') {
      // Content Security Policy
      let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (!cspMeta) {
        cspMeta = document.createElement('meta');
        cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
        cspMeta.setAttribute('content', 
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: https:; " +
          "font-src 'self' data:; " +
          "connect-src 'self' https:; " +
          "frame-ancestors 'none';"
        );
        document.head.appendChild(cspMeta);
      }

      // Referrer Policy
      let referrerMeta = document.querySelector('meta[name="referrer"]');
      if (!referrerMeta) {
        referrerMeta = document.createElement('meta');
        referrerMeta.setAttribute('name', 'referrer');
        referrerMeta.setAttribute('content', 'strict-origin-when-cross-origin');
        document.head.appendChild(referrerMeta);
      }

      // Robots meta for sensitive pages
      let robotsMeta = document.querySelector('meta[name="robots"]');
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        robotsMeta.setAttribute('content', 'noindex, nofollow, nosnippet, noarchive');
        document.head.appendChild(robotsMeta);
      }

      // X-Content-Type-Options
      let contentTypeMeta = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
      if (!contentTypeMeta) {
        contentTypeMeta = document.createElement('meta');
        contentTypeMeta.setAttribute('http-equiv', 'X-Content-Type-Options');
        contentTypeMeta.setAttribute('content', 'nosniff');
        document.head.appendChild(contentTypeMeta);
      }

      // X-Frame-Options
      let frameOptionsMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
      if (!frameOptionsMeta) {
        frameOptionsMeta = document.createElement('meta');
        frameOptionsMeta.setAttribute('http-equiv', 'X-Frame-Options');
        frameOptionsMeta.setAttribute('content', 'DENY');
        document.head.appendChild(frameOptionsMeta);
      }
    }

    return cleanup;
  }, []);

  return <>{children}</>;
};

// Enhanced security utility functions
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const isSecureContext = (): boolean => {
  return typeof window !== 'undefined' && (
    window.isSecureContext || 
    location.protocol === 'https:' || 
    location.hostname === 'localhost'
  );
};

export const logSecurityEvent = (event: string, details?: any): void => {
  const timestamp = new Date().toISOString();
  const eventData = {
    event,
    details,
    timestamp,
    userAgent: navigator.userAgent,
    url: window.location.href,
    sessionId: sessionStorage.getItem('csrf_token')
  };

  if (process.env.NODE_ENV === 'development') {
    console.warn(`🔒 Security Event: ${event}`, eventData);
  }
  
  // In production, this would send to a security monitoring service
  // Store in session for potential audit
  const securityLog = JSON.parse(sessionStorage.getItem('security_log') || '[]');
  securityLog.push(eventData);
  
  // Keep only last 50 events to prevent storage overflow
  if (securityLog.length > 50) {
    securityLog.splice(0, securityLog.length - 50);
  }
  
  sessionStorage.setItem('security_log', JSON.stringify(securityLog));
};

export const getCSRFToken = (): string | null => {
  return sessionStorage.getItem('csrf_token');
};

export const validateCSRFToken = (token: string): boolean => {
  const storedToken = getCSRFToken();
  return storedToken !== null && storedToken === token;
};
