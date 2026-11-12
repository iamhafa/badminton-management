'use client';

import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import { useEffect } from 'react';
import { useEventListener } from 'usehooks-ts';

/** Theo dõi mạng của trình duyệt và cập nhật trạng thái kết nối. Không hiển thị gì. Gắn một lần ở layout gốc. */
export default function ConnectionWatcher() {
  const setOnline: VoidFunction = useConnectionStore((state: ConnectionState) => state.setOnline);
  const setOffline: VoidFunction = useConnectionStore((state: ConnectionState) => state.setOffline);

  useEventListener('online', setOnline);
  useEventListener('offline', setOffline);

  useEffect(() => {
    if (!navigator.onLine) setOffline();
  }, [setOffline]);

  return null;
}
