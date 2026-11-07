'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { cn } from '@/libs/utils';
import type { Gender, Player } from '@/types/badminton';
import { Edit3, Plus, Users, X } from 'lucide-react';
import { useState } from 'react';
import RoleBadge, { GenderTag } from '../RoleBadge';

export { GenderTag };

interface ParticipantSelectorProps {
  roster: Player[];
  rosterLoading: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  guests: Player[];
  onAddGuest: (name: string, gender: Gender) => void;
  onUpdateGuest: (id: string, patch: Partial<Pick<Player, 'name' | 'gender'>>) => void;
  onRemoveGuest: (id: string) => void;
  onNavigateRoster?: () => void;
}

export default function ParticipantSelector({
  roster,
  rosterLoading,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  guests,
  onAddGuest,
  onUpdateGuest,
  onRemoveGuest,
  onNavigateRoster,
}: ParticipantSelectorProps) {
  const selected = new Set(selectedIds);
  const [pendingName, setPendingName] = useState('');
  const [pendingGender, setPendingGender] = useState<Gender>('MALE');

  const maleCount =
    roster.filter((m) => selected.has(m.id) && m.gender === 'MALE').length + guests.filter((g) => g.gender === 'MALE').length;
  const femaleCount =
    roster.filter((m) => selected.has(m.id) && m.gender === 'FEMALE').length + guests.filter((g) => g.gender === 'FEMALE').length;
  const totalCount = maleCount + femaleCount;

  function handleAdd() {
    onAddGuest(pendingName, pendingGender);
    setPendingName('');
  }

  return (
    <div className="rounded-2xl bg-white p-3.5 sm:p-6 shadow-sm border border-gray-100 flex flex-col gap-4 sm:gap-5">
      {/* Section Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#d1fae5] text-xs font-bold text-[#047857]">
            2
          </span>
          <div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Danh sách người chơi hôm nay</h2>
            <p className="text-xs text-gray-500">Tick chọn thành viên cố định đi đánh và thêm người chơi vãng lai (nếu có)</p>
          </div>
        </div>

        {/* Summary Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="rounded-full bg-[#0f172a] px-3 py-0.5 text-xs font-bold text-white shadow-xs">{totalCount} người</span>
          <span className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-xs font-bold text-[#1d4ed8]">{maleCount} Nam</span>
          <span className="rounded-full bg-[#fce7f3] px-2.5 py-0.5 text-xs font-bold text-[#db2777]">{femaleCount} Nữ</span>
        </div>
      </div>

      {/* Thành viên cố định CLB */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-[#059669]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-800">THÀNH VIÊN CỐ ĐỊNH CỦA CLB</span>
            {onNavigateRoster && (
              <button
                type="button"
                onClick={onNavigateRoster}
                className="flex items-center gap-1 text-xs font-medium text-[#059669] hover:underline"
              >
                <Edit3 className="size-3" />
                Quản lý DS cố định
              </button>
            )}
          </div>
          {roster.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
              <button type="button" onClick={onSelectAll} className="hover:text-emerald-700 transition-colors">
                Chọn tất cả
              </button>
              <span className="text-gray-300">•</span>
              <button type="button" onClick={onClearAll} className="hover:text-gray-900 transition-colors">
                Bỏ chọn hết
              </button>
            </div>
          )}
        </div>

        {rosterLoading ? (
          <p className="py-4 text-center text-xs text-gray-400">Đang tải danh sách thành viên...</p>
        ) : roster.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">
            Chưa có thành viên cố định.{' '}
            {onNavigateRoster && (
              <button type="button" onClick={onNavigateRoster} className="text-emerald-600 font-semibold underline">
                Thêm ở tab Thành viên
              </button>
            )}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {roster.map((member) => {
              const checked = selected.has(member.id);
              const isMale = member.gender === 'MALE';
              return (
                <label
                  key={member.id}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition-all shadow-2xs',
                    checked
                      ? isMale
                        ? 'border-[#93c5fd] bg-[#f0f9ff]'
                        : 'border-[#f9a8d4] bg-[#fdf2f8]'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50',
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggle(member.id)}
                      className={cn(
                        'rounded',
                        checked
                          ? isMale
                            ? 'border-blue-500 bg-blue-600 text-white'
                            : 'border-pink-500 bg-pink-600 text-white'
                          : 'border-gray-300',
                      )}
                    />
                    <span className={cn('truncate text-sm font-semibold', checked ? 'text-gray-900' : 'text-gray-600')}>
                      {member.name}
                    </span>
                    <RoleBadge role={member.role} />
                  </div>

                  <span
                    className={cn(
                      'shrink-0 rounded px-2 py-0.5 text-xs font-semibold',
                      isMale ? 'bg-[#e0f2fe] text-[#0284c7]' : 'bg-[#fce7f3] text-[#db2777]',
                    )}
                  >
                    {isMale ? '♂ Nam' : '♀ Nữ'}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Tuyển người chơi vãng lai hôm nay */}
      <div className="rounded-xl border border-[#fed7aa] bg-[#fffaf0] p-3.5 sm:p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">👥</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#c2410c]">
              6. TUYỂN NGƯỜI CHƠI VÃNG LAI HÔM NAY
            </span>
          </div>
          {guests.length > 0 && (
            <span className="rounded-md border border-[#fed7aa] bg-[#ffedd5] px-2 py-0.5 text-[11px] font-bold text-[#c2410c]">
              {guests.length} vãng lai
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-500 -mt-1">
          Vãng lai được tính phí theo giới tính (Nam hoặc Nữ) giống hệt thành viên cố định
        </p>

        {/* Add Guest Form */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={pendingName}
            onChange={(e) => setPendingName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Tên vãng lai (Bỏ trống = Vãng lai 1, 2...)"
            className="h-10 bg-white border-gray-200 text-sm font-medium flex-1 rounded-lg"
          />
          <div className="flex gap-2 shrink-0">
            <NativeSelect
              value={pendingGender}
              onChange={(e) => setPendingGender(e.target.value as Gender)}
              className="h-10 bg-white border-gray-200 text-xs font-semibold rounded-lg"
            >
              <NativeSelectOption value="MALE">♂ Nam (Vãng lai)</NativeSelectOption>
              <NativeSelectOption value="FEMALE">♀ Nữ (Vãng lai)</NativeSelectOption>
            </NativeSelect>
            <button
              type="button"
              onClick={handleAdd}
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] px-4 text-xs font-bold text-white shadow-sm transition-all"
            >
              <Plus className="size-4" />
              <span>Thêm vãng lai</span>
            </button>
          </div>
        </div>

        {/* Guest List Chips */}
        {guests.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {guests.map((guest) => {
              const isMale = guest.gender === 'MALE';
              return (
                <div
                  key={guest.id}
                  className="flex items-center gap-2 rounded-lg border border-amber-200/90 bg-white px-2.5 py-1.5 shadow-2xs"
                >
                  <span className="shrink-0 rounded bg-[#fbbf24] px-1.5 py-0.5 text-[10px] font-extrabold text-amber-950 uppercase">
                    Vãng lai
                  </span>
                  <Input
                    value={guest.name}
                    onChange={(e) => onUpdateGuest(guest.id, { name: e.target.value })}
                    className="h-6 w-24 border-0 p-0 text-xs font-bold text-gray-800 shadow-none focus-visible:ring-0"
                  />
                  <span
                    className={cn(
                      'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold',
                      isMale ? 'bg-[#e0f2fe] text-[#0284c7]' : 'bg-[#fce7f3] text-[#db2777]',
                    )}
                  >
                    {isMale ? '♂ Nam' : '♀ Nữ'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveGuest(guest.id)}
                    className="flex size-4 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors"
                    title="Xóa"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
