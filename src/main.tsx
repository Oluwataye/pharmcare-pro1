
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import App from './App.tsx'
import './index.css'

// Create a client with enhanced offline capabilities
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 30, // 30 days (increased from 24 hours)
      staleTime: 1000 * 60 * 30, // 30 minutes (increased from 5 minutes)
      retry: 3,
      retryDelay: attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30000),
      networkMode: 'always', // Try online first, then fall back to cache
    },
    mutations: {
      retry: 3,
      networkMode: 'online',
    }
  },
});

// Create an enhanced persister with increased storage capacity
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'PHARMACARE_CACHE', // Specific key for our app cache
  throttleTime: 1000, // Save at most once per second
  serialize: data => JSON.stringify(data),
  deserialize: data => JSON.parse(data),
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App queryClient={queryClient} persister={persister} />
  </StrictMode>
);
