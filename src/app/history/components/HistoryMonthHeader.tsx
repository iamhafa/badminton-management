import { formatVND } from '@/utils/format';

interface HistoryMonthHeaderProps {
  label: string;
  count: number;
  total: number;
}

/** Tiêu đề 1 tháng trong lịch sử: tên tháng, số buổi và tổng chi phí của tháng đó. */
export default function HistoryMonthHeader({ label, count, total }: HistoryMonthHeaderProps) {
  return (
    <div className="flex items-baseline justify-between gap-2 px-1 pt-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</h3>
      <span className="text-xs text-gray-500">
        {count} buổi · <span className="font-semibold text-gray-700">{formatVND(total)}</span>
      </span>
    </div>
  );
}
