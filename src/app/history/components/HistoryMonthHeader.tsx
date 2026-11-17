import { formatVND } from '@/utils/format';

interface HistoryMonthHeaderProps {
  label: string;
  count: number;
  total: number;
  /** Tổng tiền chưa thu của các buổi trong tháng. */
  outstanding: number;
}

/** Tiêu đề 1 tháng trong lịch sử: tên tháng, số buổi, tổng chi phí và số tiền còn thiếu của tháng đó. */
export default function HistoryMonthHeader({ label, count, total, outstanding }: HistoryMonthHeaderProps) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 px-1 pt-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</h3>
      <span className="text-xs text-gray-500">
        {count} buổi · <span className="font-semibold text-gray-700">{formatVND(total)}</span>
        {outstanding > 0 && (
          <>
            {' · '}còn thiếu <span className="font-semibold text-amber-700">{formatVND(outstanding)}</span>
          </>
        )}
      </span>
    </div>
  );
}
