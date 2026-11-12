import { cn } from 'cn';
import { LoaderCircle } from 'lucide-react';

interface LoadingStateProps {
  className?: string;
}

/** Giao diện chờ dùng chung cho cả app (trang tải dữ liệu, `loading.tsx`). */
export default function LoadingState({ className }: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-none fixed inset-0 z-40 flex items-center justify-center gap-2 text-sm text-muted-foreground',
        className,
      )}
    >
      <LoaderCircle className="size-4 animate-spin" />
      Đang tải...
    </div>
  );
}
