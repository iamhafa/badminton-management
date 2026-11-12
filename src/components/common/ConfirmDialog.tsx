'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ConfirmState, useConfirmStore } from '@/stores/confirm.store';

/** Hộp thoại xác nhận dùng chung. Gắn một lần ở layout gốc, mở bằng `confirm()` từ `confirm.store`. */
export default function ConfirmDialog() {
  const isOpen: boolean = useConfirmStore((state: ConfirmState) => state.isOpen);
  const options = useConfirmStore((state: ConfirmState) => state.options);
  const settle = useConfirmStore((state: ConfirmState) => state.settle);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) settle(false);
      }}
    >
      {options && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            {options.description && <AlertDialogDescription>{options.description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{options.cancelLabel ?? 'Hủy'}</AlertDialogCancel>
            <AlertDialogAction variant={options.destructive ? 'destructive' : 'default'} onClick={() => settle(true)}>
              {options.confirmLabel ?? 'Đồng ý'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
