'use client';

import RoleBadge from '@/components/common/RoleBadge';
import type { TSessionDraft } from '@/types/session.type';
import { buildSessionTitle } from '@/utils/date';
import { describePayable, formatVND } from '@/utils/format';
import { countPlayers, sumRoundedPayable } from '@/utils/session';
import { cn } from 'cn';
import { CalendarDays, Clock, LoaderCircle, MapPin, Save, UsersRound } from 'lucide-react';
import { useBoolean } from 'usehooks-ts';

interface CalculatorBillSummaryCardProps {
  bill: TSessionDraft;
  onSave: () => Promise<void>;
  cloudOnline: boolean;
  /** Lý do chưa được lưu (VD: chưa chọn sân). Có giá trị thì nút Lưu bị khóa. */
  saveBlockedReason?: string;
}

export default function CalculatorBillSummaryCard({
  bill,
  onSave,
  cloudOnline,
  saveBlockedReason,
}: CalculatorBillSummaryCardProps) {
  const { value: saving, setTrue: startSaving, setFalse: stopSaving } = useBoolean(false);

  const players = bill.session_players;
  const { totalCount, maleCount, femaleCount } = countPlayers(players);
  const hasPlayers: boolean = totalCount > 0;
  const collected: number = sumRoundedPayable(players);
  const avgPerPerson: number = hasPlayers ? Math.round(bill.total_cost / totalCount) : 0;
  const isCapInEffect: boolean = maleCount > 0 && femaleCount > 0 && bill.rounded_female_unit < bill.rounded_male_unit;
  const canSave: boolean = hasPlayers && !saving && cloudOnline && !saveBlockedReason;

  async function handleSave() {
    if (!canSave) return;
    startSaving();
    try {
      await onSave();
    } finally {
      stopSaving();
    }
  }

  return (
    <div className="lg:sticky lg:top-20 flex flex-col overflow-hidden rounded-2xl shadow-lg border border-gray-200/80 bg-white">
      {/* Top Dark Header Card */}
      <div className="bg-[#0e241c] p-4 sm:p-5 text-white flex flex-col gap-3.5">
        {/* Header tag + hours */}
        <div className="flex items-center justify-between">
          <span className="rounded-full uppercase bg-[#0d3b2f] px-3 py-1 text-[11px] font-extrabold tracking-wider text-[#34d399] border border-[#165c49]">
            Bảng tính chi tiết
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#0d3b2f] px-2.5 py-1 text-[11px] font-semibold text-[#34d399] border border-[#165c49]">
            <Clock className="size-3" />
            {bill.hours_played} tiếng
          </span>
        </div>

        {/* Date + group + court */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <CalendarDays className="size-4 shrink-0 text-[#34d399]" />
            <span>{buildSessionTitle(bill.iso_date) || 'Chưa chọn ngày'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <UsersRound className="size-3.5 shrink-0 text-[#34d399]" />
              {bill.group_name || 'Chưa chọn nhóm'}
            </span>
            <span className={cn('flex items-center gap-1.5', !bill.court_name && 'text-amber-400')}>
              <MapPin className="size-3.5 shrink-0 text-[#34d399]" />
              {bill.court_name || 'Chưa chọn sân'}
            </span>
          </div>
        </div>

        {/* Total cost + Average */}
        <div className="flex items-baseline justify-between pt-0.5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tổng chi phí buổi chơi</div>
            <div className="text-3xl font-black tracking-tight text-white mt-0.5">{formatVND(bill.total_cost)}</div>
          </div>
          {hasPlayers && (
            <div className="text-right">
              <div className="text-[10px] font-medium text-gray-400">Trung bình / người</div>
              <div className="text-base font-bold text-[#34d399] mt-0.5">{formatVND(avgPerPerson)}</div>
            </div>
          )}
        </div>

        {/* 3 Cost boxes */}
        <div className={`grid gap-1.5 sm:gap-2 pt-1 ${bill.water_fee > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <div className="flex flex-col items-center justify-center rounded-lg bg-[#16382c] px-1 sm:px-2 py-2 text-center border border-[#204a3c]">
            <span className="text-[9px] sm:text-[10px] text-gray-400 leading-tight">Tiền sân ({bill.hours_played}h)</span>
            <span className="text-[11px] sm:text-xs font-bold text-white mt-0.5">{formatVND(bill.court_fee)}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-[#16382c] px-1 sm:px-2 py-2 text-center border border-[#204a3c]">
            <span className="text-[9px] sm:text-[10px] text-gray-400 leading-tight truncate w-full">
              {bill.shuttle_brand || 'Cầu'} ({bill.shuttles_used}q)
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-[#facc15] mt-0.5">{formatVND(bill.shuttle_total_cost)}</span>
          </div>
          {bill.water_fee > 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg bg-[#16382c] px-1 sm:px-2 py-2 text-center border border-[#204a3c]">
              <span className="text-[9px] sm:text-[10px] text-gray-400 leading-tight">
                Nước{' '}
                {bill.water_drinkers_count !== undefined && bill.water_drinkers_count < totalCount
                  ? `(${bill.water_drinkers_count}u)`
                  : 'lọc'}
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-[#38bdf8] mt-0.5">{formatVND(bill.water_fee)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom White Details Card */}
      <div className="p-4 sm:p-5 flex flex-col gap-4">
        {/* 2 Rate boxes */}
        {hasPlayers && (
          <div className="grid grid-cols-2 gap-2.5">
            {/* Box Nữ */}
            <div className="flex flex-col justify-between rounded-xl border border-pink-200/80 bg-[#fff5f8] p-3 shadow-xs">
              <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[11px] font-extrabold uppercase text-[#be185d]">MỨC ĐÓNG NỮ</span>
                <span className="rounded-full bg-pink-100 px-2 py-0.5 text-center text-[10px] leading-tight font-bold text-[#be185d]">
                  {isCapInEffect ? `Tối đa ${bill.female_cap / 1000}k` : 'Chia đều'}
                </span>
              </div>
              <div className="my-1.5 text-2xl font-black text-gray-900 tracking-tight">
                {femaleCount ? formatVND(bill.rounded_female_unit) : '—'}
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                {femaleCount > 0
                  ? `${femaleCount} Nữ (${players.filter((p) => p.gender === 'FEMALE' && p.type === 'REGULAR').length} Cố định${players.filter((p) => p.gender === 'FEMALE' && p.type === 'GUEST').length > 0 ? `, ${players.filter((p) => p.gender === 'FEMALE' && p.type === 'GUEST').length} vãng lai` : ''})`
                  : '0 Nữ'}
              </div>
            </div>

            {/* Box Nam */}
            <div className="flex flex-col justify-between rounded-xl border border-blue-200/80 bg-[#f4f9ff] p-3 shadow-xs">
              <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[11px] font-extrabold uppercase text-[#1d4ed8]">MỨC ĐÓNG NAM</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-center text-[10px] leading-tight font-bold text-[#1d4ed8]">
                  {isCapInEffect ? 'Chia phần còn lại' : 'Chia đều'}
                </span>
              </div>
              <div className="my-1.5 text-2xl font-black text-gray-900 tracking-tight">
                {maleCount ? formatVND(bill.rounded_male_unit) : '—'}
              </div>
              <div className="text-[11px] text-gray-500 font-medium truncate">
                {maleCount > 0
                  ? `${maleCount} Nam (${players.filter((p) => p.gender === 'MALE' && p.type === 'REGULAR').length} Cố định${players.filter((p) => p.gender === 'MALE' && p.type === 'GUEST').length > 0 ? `, ${players.filter((p) => p.gender === 'MALE' && p.type === 'GUEST').length} vãng lai` : ''})`
                  : '0 Nam'}
              </div>
            </div>
          </div>
        )}

        {/* Chi tiết từng người chơi */}
        <div>
          {hasPlayers ? (
            <>
              <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <span className="flex items-center gap-1.5">
                  CHI TIẾT TỪNG NGƯỜI CHƠI
                  <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal text-gray-600">
                    {totalCount} người
                  </span>
                </span>
                <span className="uppercase text-[#059669]">Số tiền cần đóng</span>
              </div>
              <ul className="max-h-120 divide-y divide-gray-100 overflow-y-auto pr-1">
                {players.map((p) => (
                  <li key={p.player_id} className="flex items-center justify-between py-2 text-sm">
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                      <span className="font-semibold text-gray-900 truncate">{p.name}</span>
                      <RoleBadge role={p.role} />
                      <span
                        className={cn(
                          'shrink-0 rounded px-1.5 py-0.2 text-[10px] font-bold',
                          p.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700',
                        )}
                      >
                        {p.gender === 'MALE' ? 'Nam' : 'Nữ'}
                      </span>
                      {p.type === 'GUEST' && (
                        <span
                          className={cn(
                            'shrink-0 text-[10px] rounded px-1.5 py-0.2 font-medium',
                            p.guest_source === 'FACEBOOK'
                              ? 'bg-blue-50 text-[#1877f2] font-semibold border border-blue-200'
                              : 'text-gray-400 italic',
                          )}
                        >
                          {p.guest_source === 'FACEBOOK' ? 'vãng lai FB' : 'vãng lai'}
                        </span>
                      )}
                      {!p.drinks_water && bill.water_fee > 0 && (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.2 text-[10px] font-medium text-gray-500">
                          K.nước
                        </span>
                      )}
                      {p.water_credit > 0 && (
                        <span className="shrink-0 text-[10px] font-medium text-amber-600">(ứng {formatVND(p.water_credit)})</span>
                      )}
                    </div>
                    <span className={cn('shrink-0 font-bold', p.rounded_payable < 0 ? 'text-amber-600' : 'text-gray-900')}>
                      {describePayable(p.rounded_payable)}
                    </span>
                  </li>
                ))}
              </ul>
              <RoundingNote bill={bill} collected={collected} />
            </>
          ) : (
            <p className="text-center py-4 text-xs text-gray-400">Chọn thành viên hoặc thêm vãng lai để tính tiền.</p>
          )}
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-1.5 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            title={!cloudOnline ? 'Chưa kết nối Cloud' : saveBlockedReason}
            className={cn(
              'flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all',
              canSave ? 'bg-[#059669] hover:bg-[#047857] active:bg-[#065f46]' : 'bg-gray-300 cursor-not-allowed text-gray-500',
            )}
          >
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
            Lưu vào Lịch sử
          </button>
          {hasPlayers && saveBlockedReason && (
            <p className="text-center text-[11px] font-medium text-amber-600">{saveBlockedReason}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Ghi chú chênh lệch do làm tròn: so tổng thu thực tế với số cần thu. Không lệch thì không hiện gì.
 * `collected` là tổng số tiền mọi người đóng sau khi làm tròn về hàng nghìn.
 */
function RoundingNote({ bill, collected }: { bill: TSessionDraft; collected: number }) {
  const players = bill.session_players;
  // Trừ phần đã ứng trước (vd: người mua nước) vì khoản đó đã được trả, không cần thu lại
  const advanced: number = players.reduce((sum, p: TSessionDraft['session_players'][number]) => sum + p.water_credit, 0);
  const expected: number = bill.total_cost - advanced;
  const diff: number = collected - expected;
  if (diff === 0) return null;

  const advancer: TSessionDraft['session_players'][number] | undefined = players.find((p) => p.water_credit > 0);

  return (
    <div className="mt-1 flex flex-col gap-0.5 text-[11px] leading-relaxed text-gray-400">
      <p>
        Tổng thu từ mọi người: <span className="font-semibold text-gray-500">{formatVND(collected)}</span>
        {' · '}Cần thu: <span className="font-semibold text-gray-500">{formatVND(expected)}</span>
        {advancer ? ` (đã trừ ${formatVND(advanced)} ${advancer.name} ứng trước)` : ''}
      </p>
      <p>
        {diff > 0 ? 'Dư' : 'Hụt'} {formatVND(Math.abs(diff))} vì số tiền của mỗi người được làm tròn về hàng nghìn.
      </p>
    </div>
  );
}
