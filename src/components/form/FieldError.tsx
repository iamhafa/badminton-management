/** Thông báo lỗi dưới ô nhập. Không hiện gì khi không có lỗi. */
export function FieldError({ message, className }: { message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className={className ?? 'text-xs text-destructive'}>
      {message}
    </p>
  );
}
