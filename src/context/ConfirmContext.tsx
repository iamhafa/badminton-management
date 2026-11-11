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
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { useBoolean } from 'usehooks-ts';

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export type ConfirmFunction = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const { value: open, setTrue: openDialog, setFalse: closeDialog } = useBoolean(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback(
    (value: boolean) => {
      resolverRef.current?.(value);
      resolverRef.current = null;
      closeDialog();
    },
    [closeDialog],
  );

  const confirm = useCallback<ConfirmFunction>(
    (opts: ConfirmOptions) => {
      resolverRef.current?.(false); // Hủy hộp thoại cũ nếu còn treo
      setOptions(opts);
      openDialog();
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
      });
    },
    [openDialog],
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={open}
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
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFunction {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return ctx;
}

