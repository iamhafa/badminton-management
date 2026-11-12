'use client';

import { useConnectionStore } from '@/stores/connection.store';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

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

/** Cung cấp QueryClient cho toàn app. Mỗi lần mở app tạo một client riêng (không dùng chung giữa các người dùng). */
export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
