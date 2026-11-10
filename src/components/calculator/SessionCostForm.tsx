'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { FEMALE_CAP_PRESETS, formatVND, SHUTTLES_PER_TUBE } from '@/libs/calculator';
import { getWeekdayVN } from '@/libs/date-utils';
import { cn } from '@/libs/utils';
import type { Group, Player, SessionInput, Shuttlecock, Court } from '@/types/badminton';
import { CalendarDays, Droplet, Feather, Grid2X2, MapPin, Minus, Plus, RotateCcw, UsersRound, Venus } from 'lucide-react';
import Link from 'next/link';

const COURT_FEE_PRESETS = [240000, 280000, 300000, 360000];
const WATER_FEE_PRESETS = [0, 35000, 40000, 50000];

// Giá trị mẫu khi bấm "Khôi phục mẫu ví dụ".
// Giữ nguyên nhóm, sân, loại cầu và ngày chơi; mức trần nữ và giá ống lấy theo nhóm / loại cầu đang chọn.
const DEFAULT_INPUT_VALUES: Omit<
  SessionInput,
  'isoDate' | 'groupId' | 'courtId' | 'femaleCap' | 'shuttlecockId' | 'shuttleBrand' | 'tubePrice'
> = {
  hoursPlayed: 2,
  courtFee: 280000,
  shuttlesUsed: 5,
  waterFee: 40000,
  waterPayerId: '',
};

interface SessionCostFormProps {
  input: SessionInput;
  onChange: (patch: Partial<SessionInput>) => void;
  participants: Player[];
  /** Các nhóm đang dùng (chưa ẩn). */
  groups: Group[];
  /** Các sân đang dùng (chưa ẩn). */
  courts: Court[];
  /** Các loại cầu đang dùng (chưa ẩn). */
  shuttlecocks: Shuttlecock[];
  /** Đổi nhóm (trang cha có thể hỏi xác nhận trước khi xóa lựa chọn người chơi). */
  onGroupChange: (groupId: string) => void;
}

export default function SessionCostForm({
  input,
  onChange,
  participants,
  groups,
  courts,
  shuttlecocks,
  onGroupChange,
}: SessionCostFormProps) {
  const shuttleUnit = input.tubePrice / SHUTTLES_PER_TUBE;
  const shuttleTotalCost = shuttleUnit * input.shuttlesUsed;
  const weekday = getWeekdayVN(input.isoDate);
  const groupFemaleCap = groups.find((g) => g.id === input.groupId)?.femaleCap;
  const selectedShuttlecock = shuttlecocks.find((s) => s.id === input.shuttlecockId);

  function handleReset() {
    onChange({
      ...DEFAULT_INPUT_VALUES,
      ...(groupFemaleCap ? { femaleCap: groupFemaleCap } : {}),
      ...(selectedShuttlecock ? { tubePrice: selectedShuttlecock.tubePrice } : {}),
    });
  }

  /** Chọn loại cầu: điền sẵn giá ống mặc định của loại đó, giá vẫn sửa được. */
  function handleShuttlecockChange(id: string) {
    const picked = shuttlecocks.find((s) => s.id === id);
    onChange(picked ? { shuttlecockId: picked.id, tubePrice: picked.tubePrice } : { shuttlecockId: '' });
  }

  return (
    <div className="rounded-2xl bg-white p-3.5 sm:p-6 shadow-sm border border-gray-100 flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#d1fae5] text-xs font-bold text-[#047857]">
            1
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">Thông số chi phí buổi chơi</h2>
            <p className="text-xs text-gray-500">Chọn nhóm, sân và nhập chi phí của buổi chơi hôm nay</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-xs font-semibold text-[#059669] hover:text-[#047857] transition-colors shrink-0"
        >
          <RotateCcw className="size-3.5" />
          <span className="hidden sm:inline">Khôi phục mẫu ví dụ</span>
          <span className="sm:hidden">Mẫu ví dụ</span>
        </button>
      </div>

      {/* Row 0: Group + Court */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Nhóm */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="session-group" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            NHÓM
          </Label>
          <div className="relative">
            <UsersRound className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
            <NativeSelect
              id="session-group"
              value={input.groupId}
              onChange={(e) => onGroupChange(e.target.value)}
              disabled={groups.length === 0}
              className="w-full [&_select]:h-10 [&_select]:pl-9 [&_select]:bg-white [&_select]:border-gray-200 [&_select]:rounded-lg [&_select]:font-semibold"
            >
              {groups.length === 0 ? (
                <NativeSelectOption value="">Chưa có nhóm nào</NativeSelectOption>
              ) : (
                groups.map((g) => (
                  <NativeSelectOption key={g.id} value={g.id}>
                    {g.name}
                  </NativeSelectOption>
                ))
              )}
            </NativeSelect>
          </div>
          {groups.length === 0 && (
            <p className="text-[11px] text-gray-500">
              <Link href="/settings/groups" className="font-semibold text-[#059669] underline">
                Tạo nhóm
              </Link>{' '}
              ở Cài đặt để bắt đầu tính tiền.
            </p>
          )}
        </div>

        {/* Sân chơi */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="session-court" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            SÂN CHƠI <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
            <NativeSelect
              id="session-court"
              value={input.courtId}
              onChange={(e) => onChange({ courtId: e.target.value })}
              aria-required="true"
              aria-invalid={!input.courtId}
              className={cn(
                'w-full [&_select]:h-10 [&_select]:pl-9 [&_select]:bg-white [&_select]:rounded-lg [&_select]:font-semibold',
                input.courtId ? '[&_select]:border-gray-200' : '[&_select]:border-amber-300',
              )}
            >
              <NativeSelectOption value="">-- Chọn sân --</NativeSelectOption>
              {courts.map((v) => (
                <NativeSelectOption key={v.id} value={v.id}>
                  {v.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          {courts.length === 0 ? (
            <p className="text-[11px] text-gray-500">
              Chưa có sân nào.{' '}
              <Link href="/settings/courts" className="font-semibold text-[#059669] underline">
                Thêm sân
              </Link>{' '}
              ở Cài đặt.
            </p>
          ) : (
            !input.courtId && <p className="text-[11px] text-amber-600">Bắt buộc chọn sân để lưu buổi chơi.</p>
          )}
        </div>
      </div>

      {/* Row 1: Date + Hours */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Ngày chơi */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">NGÀY CHƠI</Label>
          <div className="flex items-stretch gap-2">
            <div className="relative flex-1">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="date"
                value={input.isoDate}
                onChange={(e) => e.target.value && onChange({ isoDate: e.target.value })}
                className="pl-9 h-10 min-h-10 w-full appearance-none [-webkit-appearance:none] [color-scheme:light] font-semibold text-gray-800 rounded-lg border-gray-200"
              />
            </div>
            {weekday && (
              <span className="flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#dcfce7] px-3.5 text-xs font-bold text-[#15803d] border border-[#86efac]">
                {weekday}
              </span>
            )}
          </div>
        </div>

        {/* Số giờ chơi */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">SỐ GIỜ CHƠI</Label>
          <div className="flex h-10 items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => onChange({ hoursPlayed: Math.max(0.5, input.hoursPlayed - 0.5) })}
              className="flex h-full w-10 shrink-0 items-center justify-center border-r border-gray-200 text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <Minus className="size-3.5" />
            </button>
            <div className="flex flex-1 items-center justify-center gap-1.5">
              <span className="text-base font-bold text-gray-900">{input.hoursPlayed}</span>
              <span className="text-xs text-gray-400">tiếng</span>
            </div>
            <button
              type="button"
              onClick={() => onChange({ hoursPlayed: input.hoursPlayed + 0.5 })}
              className="flex h-full w-10 shrink-0 items-center justify-center border-l border-gray-200 text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Court fee + Female cap */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Tiền thuê sân */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">TIỀN THUÊ SÂN</Label>
          <div className="relative">
            <Grid2X2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              inputMode="numeric"
              value={input.courtFee ? input.courtFee.toLocaleString('vi-VN') : ''}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                onChange({ courtFee: digits ? Number(digits) : 0 });
              }}
              placeholder="0"
              className="pl-9 pr-12 h-10 font-bold text-gray-900 rounded-lg border-gray-200"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
              VNĐ
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {COURT_FEE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChange({ courtFee: preset })}
                className={cn(
                  'rounded px-2.5 py-0.5 text-xs font-semibold border transition-all',
                  input.courtFee === preset
                    ? 'bg-[#dcfce7] border-[#16a34a] text-[#15803d]'
                    : 'bg-[#f1f5f9] border-transparent text-gray-600 hover:bg-gray-200',
                )}
              >
                {preset / 1000}k
              </button>
            ))}
          </div>
        </div>

        {/* Mức trần ưu tiên nữ */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-[#db2777]">MỨC TRẦN ƯU TIÊN NỮ (TỐI ĐA)</Label>
          <div className="relative">
            <Venus className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#ec4899]" />
            <Input
              inputMode="numeric"
              value={input.femaleCap ? input.femaleCap.toLocaleString('vi-VN') : ''}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                onChange({ femaleCap: digits ? Number(digits) : 0 });
              }}
              placeholder="0"
              className="pl-8 pr-16 h-10 font-bold text-[#be185d] border-pink-200 focus-visible:border-pink-400 rounded-lg"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#ec4899]">
              VNĐ/nữ
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-1.5 mt-0.5">
            <div className="flex gap-1.5">
              {FEMALE_CAP_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange({ femaleCap: preset })}
                  className={cn(
                    'rounded px-2.5 py-0.5 text-xs font-semibold border transition-all',
                    input.femaleCap === preset
                      ? 'bg-[#fce7f3] border-[#f472b6] text-[#be185d]'
                      : 'bg-[#f1f5f9] border-transparent text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {preset / 1000}k
                </button>
              ))}
            </div>
            <span className="text-[10px] sm:text-[11px] text-gray-400 italic">Áp dụng cả Nữ cố định &amp; vãng lai</span>
          </div>
        </div>
      </div>

      {/* Chi phí cầu lông (Card vàng cam) */}
      <div className="rounded-xl border border-[#fde68a] bg-[#fffdf0] p-3.5 sm:p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#b45309] uppercase tracking-wide">
            <Feather className="size-4 text-[#d97706] shrink-0" />
            <span>CHI PHÍ CẦU LÔNG ({SHUTTLES_PER_TUBE} QUẢ / ỐNG)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Loại cầu */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="session-shuttlecock" className="text-[11px] font-medium text-gray-600">
              Loại cầu <span className="text-red-500">*</span>
            </Label>
            <NativeSelect
              id="session-shuttlecock"
              value={input.shuttlecockId}
              onChange={(e) => handleShuttlecockChange(e.target.value)}
              aria-required="true"
              aria-invalid={!input.shuttlecockId}
              className={cn(
                'w-full [&_select]:h-9 [&_select]:bg-white [&_select]:rounded-md [&_select]:font-medium',
                input.shuttlecockId ? '[&_select]:border-gray-200' : '[&_select]:border-amber-300',
              )}
            >
              <NativeSelectOption value="">-- Chọn loại cầu --</NativeSelectOption>
              {shuttlecocks.map((s) => (
                <NativeSelectOption key={s.id} value={s.id}>
                  {s.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {shuttlecocks.length === 0 ? (
              <p className="text-[11px] text-gray-500">
                Chưa có loại cầu nào.{' '}
                <Link href="/settings/shuttlecocks" className="font-semibold text-[#059669] underline">
                  Thêm loại cầu
                </Link>{' '}
                ở Cài đặt.
              </p>
            ) : (
              !input.shuttlecockId && <p className="text-[11px] text-amber-600">Bắt buộc chọn loại cầu để lưu buổi chơi.</p>
            )}
          </div>

          {/* Giá 1 ống */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium text-gray-600">Giá 1 ống ({SHUTTLES_PER_TUBE} quả)</Label>
            <div className="relative">
              <Input
                inputMode="numeric"
                value={input.tubePrice ? input.tubePrice.toLocaleString('vi-VN') : ''}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  onChange({ tubePrice: digits ? Number(digits) : 0 });
                }}
                placeholder="0"
                className="h-9 bg-white border-gray-200 pr-12 font-semibold text-gray-900"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">đ/ống</span>
            </div>
          </div>

          {/* Số quả đã chơi */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium text-gray-600">Số quả đã chơi</Label>
            <div className="flex h-9 items-center overflow-hidden rounded-md border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => onChange({ shuttlesUsed: Math.max(0, input.shuttlesUsed - 1) })}
                className="flex h-full w-9 shrink-0 items-center justify-center border-r border-gray-200 text-gray-500 hover:bg-gray-50 active:bg-gray-100"
              >
                <Minus className="size-3.5" />
              </button>
              <div className="flex flex-1 items-center justify-center">
                <span className="text-sm font-bold text-[#b45309]">{input.shuttlesUsed}</span>
              </div>
              <button
                type="button"
                onClick={() => onChange({ shuttlesUsed: input.shuttlesUsed + 1 })}
                className="flex h-full w-9 shrink-0 items-center justify-center border-l border-gray-200 text-gray-500 hover:bg-gray-50 active:bg-gray-100"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#fde68a]/70 pt-2 text-xs">
          <span className="text-gray-500">
            Đơn giá: {formatVND(shuttleUnit)}/quả × {input.shuttlesUsed} quả
          </span>
          <span className="font-bold text-[#b45309] text-sm">= {formatVND(shuttleTotalCost)}</span>
        </div>
      </div>

      {/* Tiền nước lọc (Card xanh dương) */}
      <div className="rounded-xl border border-[#bfdbfe] bg-[#f0f7ff] p-3.5 sm:p-4 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1d4ed8] uppercase tracking-wide">
          <Droplet className="size-4 text-[#2563eb] shrink-0" />
          <span>TIỀN NƯỚC LỌC</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Số tiền nước */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] font-medium text-gray-600">Số tiền (VNĐ)</Label>
            <div className="relative">
              <Input
                inputMode="numeric"
                value={input.waterFee ? input.waterFee.toLocaleString('vi-VN') : ''}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  onChange({ waterFee: digits ? Number(digits) : 0 });
                }}
                placeholder="0"
                className="h-10 bg-white border-gray-200 pr-12 font-bold text-gray-900 rounded-lg"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                VNĐ
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {WATER_FEE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange({ waterFee: preset })}
                  className={cn(
                    'rounded px-2.5 py-0.5 text-xs font-semibold border transition-all',
                    input.waterFee === preset
                      ? 'bg-[#dbeafe] border-[#3b82f6] text-[#1d4ed8]'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-blue-50',
                  )}
                >
                  {preset === 0 ? '0đ' : `${preset / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Người mua nước */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] font-medium text-gray-600">Người mua nước</Label>
            <NativeSelect
              value={input.waterPayerId}
              onChange={(e) => onChange({ waterPayerId: e.target.value })}
              className="w-full [&_select]:h-10 [&_select]:bg-white [&_select]:border-gray-200 [&_select]:rounded-lg"
            >
              {participants.length === 0 ? (
                <NativeSelectOption value="">Chưa có người chơi nào được chọn</NativeSelectOption>
              ) : (
                participants.map((p) => {
                  const roleTag =
                    p.role === 'LEADER'
                      ? ' (Trưởng nhóm)'
                      : p.role === 'VICE_LEADER'
                        ? ' (Phó nhóm)'
                        : p.type === 'GUEST'
                          ? ' (Vãng lai)'
                          : '';
                  return (
                    <NativeSelectOption key={p.id} value={p.id}>
                      {p.name}
                      {roleTag}
                    </NativeSelectOption>
                  );
                })
              )}
            </NativeSelect>
            <p className="text-[11px] text-gray-500">Tiền nước sẽ được trừ thẳng vào số tiền cần đóng của người này.</p>
          </div>
        </div>

        {input.waterFee > 0 && participants.length > 0 && (
          <div className="flex items-center justify-between border-t border-blue-200/70 pt-2 text-xs text-blue-900 font-medium">
            <span>
              Chia cho <strong>{participants.filter((p) => p.drinksWater !== false).length}</strong> / {participants.length} người
              có uống nước
            </span>
            <span className="font-bold text-blue-700">
              ~
              {formatVND(
                participants.filter((p) => p.drinksWater !== false).length > 0
                  ? input.waterFee / participants.filter((p) => p.drinksWater !== false).length
                  : 0,
              )}
              /người
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
