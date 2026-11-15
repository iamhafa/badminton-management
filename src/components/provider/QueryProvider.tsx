'use client';

import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { useEventListener } from 'usehooks-ts';

/** Cung cấp QueryClient và theo dõi trạng thái mạng (online/offline) cho toàn app. */
export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  const setOnline: VoidFunction = useConnectionStore((state: ConnectionState) => state.setOnline);
  const setOffline: VoidFunction = useConnectionStore((state: ConnectionState) => state.setOffline);

  useEventListener('online', setOnline);
  useEventListener('offline', setOffline);

  useEffect((): void => {
    if (!navigator.onLine) {
      setOffline();
    }
  }, [setOffline]);

  return (
    <>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    </>
  );
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    // Mọi lần tải dữ liệu thành công/thất bại đều cập nhật chỉ báo kết nối Cloud ở Header.
    queryCache: new QueryCache({
      onSuccess: () => useConnectionStore.getState().setOnline(),
      onError: () => useConnectionStore.getState().setOffline(),
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000, // trong 1 phút coi dữ liệu là mới, chuyển trang không tải lại
        retry: 1, // mất mạng thì báo sớm thay vì thử lại 3 lần
      },
    },
  });
}
