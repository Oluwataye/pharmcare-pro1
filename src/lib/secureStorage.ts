
// Secure storage utility to replace direct localStorage usage for sensitive data
// Secure storage utility to replace direct localStorage usage for sensitive data
class SecureStorage {
  private readonly PREFIX = 'PHARMACARE_';
  // Removed timeout to match Supabase's persistent session behavior

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
      // No expiration date needed for persistent storage
    };
  }

  // Store data persistently
  setItem(key: string, value: any): void {
    try {
      const storageItem = this.createStorageItem(value);
      localStorage.setItem(this.PREFIX + key, JSON.stringify(storageItem));
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  }

  // Retrieve data
  getItem(key: string): any | null {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (!item) return null;

      const storageItem = JSON.parse(item);

      // No expiration check needed

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
      localStorage.removeItem(this.PREFIX + key);
    } catch (error) {
      console.error('Failed to remove data securely:', error);
    }
  }

  // Clear all secure storage
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }

  // Clean up function kept for API compatibility but does nothing
  cleanupExpired(): void {
    // No-op as we no longer enforce client-side timeouts
  }
}

export const secureStorage = new SecureStorage();
