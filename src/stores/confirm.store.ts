import type { ReactNode } from 'react';
import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>;

export interface ConfirmState {
  isOpen: boolean;
  options?: ConfirmOptions;
  resolver: (value: boolean) => void;
  confirm: ConfirmFunction;
  /** Đóng hộp thoại và trả kết quả (true: đồng ý, false: hủy) cho nơi đang chờ `confirm`. */
  settle: (value: boolean) => void;
}

/** Trạng thái hộp thoại xác nhận dùng chung (thay cho `window.confirm`). Hộp thoại hiển thị bởi `ConfirmDialog`. */
export const useConfirmStore = create<ConfirmState>()((set, get) => ({
  isOpen: false,
  options: undefined,
  resolver: () => {},
  confirm: (options: ConfirmOptions) => {
    get().resolver(false); // Hủy hộp thoại cũ nếu còn treo
    return new Promise<boolean>((resolve) =>
      set({
        isOpen: true,
        options,
        resolver: resolve,
      }),
    );
  },
  settle: (value: boolean) => {
    get().resolver(value);
    set({
      isOpen: false,
      resolver: () => {},
    });
  },
}));

/** Hỏi xác nhận từ bất cứ đâu, kể cả ngoài component: `if (!(await confirm({ title: '...' }))) return;` */
export const confirm: ConfirmFunction = (options: ConfirmOptions) => {
  return useConfirmStore.getState().confirm(options);
};
