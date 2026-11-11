'use client';

import type { RefObject } from 'react';
import { useEventListener } from 'usehooks-ts';

/** Gọi `onEscape` khi người dùng nhấn Escape trong phần tử `ref` (VD: hủy form sửa trực tiếp). */
export function useEscapeKey<T extends HTMLElement>(ref: RefObject<T | null>, onEscape: () => void) {
  useEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') onEscape();
    },
    // usehooks-ts khai báo kiểu ref không có null, nhưng thực tế nó bỏ qua khi ref.current là null
    ref as RefObject<T>,
  );
}
