import { Input } from '@/components/ui/input';
import type { ChangeEvent, ComponentProps } from 'react';

type MoneyInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type' | 'inputMode'> & {
  /** Số tiền (VNĐ). 0 hiện ô trống. */
  value: number;
  onChange: (value: number) => void;
};

/**
 * Ô nhập số tiền: hiển thị có dấu phân cách hàng nghìn, chỉ nhận chữ số.
 * Dùng được với `Controller` của react-hook-form: `<MoneyInput {...field} />`.
 */
export function MoneyInput({ value, onChange, ...props }: MoneyInputProps) {
  return (
    <Input
      inputMode="numeric"
      placeholder="0"
      value={value ? value.toLocaleString('vi-VN') : ''}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        const digits: string = e.target.value.replace(/\D/g, '');
        onChange(digits ? Number(digits) : 0);
      }}
      {...props}
    />
  );
}
