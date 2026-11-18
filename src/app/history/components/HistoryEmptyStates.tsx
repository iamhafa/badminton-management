import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, CalendarDays, CircleCheck } from 'lucide-react';
import Link from 'next/link';

const SKELETON_CARDS = 3;

/** Khung xám giữ chỗ trong lúc tải lịch sử lần đầu. */
export function HistorySkeleton() {
  return (
    <ul role="status" aria-label="Đang tải lịch sử" className="flex flex-col gap-2.5">
      {Array.from({ length: SKELETON_CARDS }, (_, i) => (
        <li key={i} className="flex animate-pulse items-center gap-3 rounded-xl border bg-white p-3 sm:p-4">
          <div className="h-14 w-12 shrink-0 rounded-lg bg-gray-100" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3.5 w-1/3 rounded bg-gray-100" />
            <div className="h-3 w-1/2 rounded bg-gray-100" />
            <div className="h-4 w-2/5 rounded-full bg-gray-100" />
          </div>
          <div className="h-5 w-20 rounded bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}

/** Đang lọc "Chưa thu đủ" nhưng mọi buổi đều đã thu đủ. */
export function HistoryAllSettled() {
  return (
    <Card className="border border-dashed ring-0">
      <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50">
          <CircleCheck className="size-6 text-emerald-600" />
        </div>
        <p className="font-semibold text-gray-800">Tất cả buổi chơi đã thu đủ tiền</p>
      </CardContent>
    </Card>
  );
}

/** Chưa có buổi chơi nào được lưu. */
export function HistoryEmpty() {
  return (
    <Card className="border border-dashed ring-0">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50">
          <CalendarDays className="size-6 text-emerald-600" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-gray-800">Chưa có buổi chơi nào được lưu</p>
          <p className="text-xs text-muted-foreground">Tính tiền và bấm "Lưu vào Lịch sử", buổi chơi sẽ hiện ở đây.</p>
        </div>
        <Link href="/calculator" className={buttonVariants({ size: 'sm', className: 'gap-1.5' })}>
          <Calculator className="size-3.5" /> Tính tiền buổi đầu tiên
        </Link>
      </CardContent>
    </Card>
  );
}
