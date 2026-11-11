'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type CloudStatus = 'connecting' | 'online' | 'offline';

interface ConnectionContextType {
  cloudStatus: CloudStatus;
  cloudOnline: boolean;
  setOnline: () => void;
  setOffline: () => void;
  retryConnection: () => void;
}

const ConnectionContext = createContext<ConnectionContextType | null>(null);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('connecting');

  const setOnline = useCallback(() => setCloudStatus('online'), []);
  const setOffline = useCallback(() => setCloudStatus('offline'), []);
  const retryConnection = useCallback(() => {
    setCloudStatus('connecting');

    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setCloudStatus('online');
    const handleOffline = () => setCloudStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setCloudStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value = useMemo(
    () => ({
      cloudStatus,
      cloudOnline: cloudStatus === 'online',
      setOnline,
      setOffline,
      retryConnection,
    }),
    [cloudStatus, setOnline, setOffline, retryConnection],
  );

  return (
    <>
      <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
    </>
  );
}

export function useConnection(): ConnectionContextType {
  const ctx = useContext(ConnectionContext);

  if (!ctx) {
    return {
      cloudStatus: 'online',
      cloudOnline: true,
      setOnline: () => {},
      setOffline: () => {},
      retryConnection: () => {},
    };
  }
  return ctx;
}
