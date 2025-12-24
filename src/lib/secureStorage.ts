
// Secure storage utility to replace direct localStorage usage for sensitive data
class SecureStorage {
  private readonly PREFIX = 'PHARMACARE_';
  private readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

  // Simple encryption/decryption using base64 (not cryptographically secure, but better than plain text)
  private encrypt(data: string): string {
    try {
      return btoa(unescape(encodeURIComponent(data)));
    } catch {
      return data; // Fallback to plain text if encoding fails
    }
  }

  private decrypt(data: string): string {
    try {
      return decodeURIComponent(escape(atob(data)));
    } catch {
      return data; // Fallback to plain text if decoding fails
    }
  }

  private createStorageItem(data: any) {
    return {
      data: this.encrypt(JSON.stringify(data)),
      timestamp: Date.now(),
      expires: Date.now() + this.SESSION_TIMEOUT
    };
  }

  // Store data with expiration
  setItem(key: string, value: any): void {
    try {
      const storageItem = this.createStorageItem(value);
      sessionStorage.setItem(this.PREFIX + key, JSON.stringify(storageItem));
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  }

  // Retrieve data with expiration check
  getItem(key: string): any | null {
    try {
      const item = sessionStorage.getItem(this.PREFIX + key);
      if (!item) return null;

      const storageItem = JSON.parse(item);
      
      // Check if item has expired
      if (Date.now() > storageItem.expires) {
        this.removeItem(key);
        return null;
      }

      return JSON.parse(this.decrypt(storageItem.data));
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      this.removeItem(key);
      return null;
    }
  }

  // Remove specific item
  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(this.PREFIX + key);
    } catch (error) {
      console.error('Failed to remove data securely:', error);
    }
  }

  // Clear all secure storage
  clear(): void {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }

  // Clean up expired items
  cleanupExpired(): void {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          const item = sessionStorage.getItem(key);
          if (item) {
            try {
              const storageItem = JSON.parse(item);
              if (Date.now() > storageItem.expires) {
                sessionStorage.removeItem(key);
              }
            } catch {
              // Remove corrupted items
              sessionStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }
}

export const secureStorage = new SecureStorage();

// Initialize cleanup on app start
secureStorage.cleanupExpired();

// Cleanup expired items every 30 minutes
setInterval(() => {
  secureStorage.cleanupExpired();
}, 30 * 60 * 1000);
