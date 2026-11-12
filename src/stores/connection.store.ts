import { create } from 'zustand';

export type CloudStatus = 'connecting' | 'online' | 'offline';

export interface ConnectionState {
  cloudStatus: CloudStatus;
  setOnline: VoidFunction;
  setOffline: VoidFunction;
  /** Thử kết nối lại bằng cách tải lại trang. */
  retryConnection: VoidFunction;
}

/**
 * Trạng thái kết nối Cloud (Firebase) của app.
 * Chỉ thay đổi từ sự kiện phía client (kết quả tải dữ liệu, mạng bật/tắt), không đặt giá trị lúc render trên server.
 */
export const useConnectionStore = create<ConnectionState>()((set) => ({
  cloudStatus: 'connecting',
  setOnline: () => set({ cloudStatus: 'online' }),
  setOffline: () => set({ cloudStatus: 'offline' }),
  retryConnection: () => {
    set({ cloudStatus: 'connecting' });
    window.location.reload();
  },
}));
