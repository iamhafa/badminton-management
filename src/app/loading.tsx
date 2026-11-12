import LoadingState from '@/components/common/LoadingState';

/**
 * Giao diện chờ khi một route đang chờ render ở server. Next.js tự bọc `page.tsx` bằng <Suspense> với fallback này
 * (Header ở layout vẫn hiển thị). Các trang tải dữ liệu ở client dùng `LoadingState` trực tiếp.
 */
export default function Loading() {
  return <LoadingState />;
}
