'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { formatVND, SHUTTLES_PER_TUBE } from '@/libs/calculator';
import { getWeekdayVN } from '@/libs/date-utils';
import { cn } from '@/libs/utils';
import { ORGANIZER_ID, type Player, type SessionInput } from '@/types/badminton';
import { CalendarDays, Feather, Grid2X2, Minus, Plus, RotateCcw } from 'lucide-react';

const COURT_FEE_PRESETS = [240000, 280000, 300000, 360000];
const FEMALE_CAP_PRESETS = [40000, 50000, 60000];
const WATER_FEE_PRESETS = [0, 35000, 40000, 50000];

type ShuttlePreset = { brand: string; tubePrice: number };
const SHUTTLE_PRESETS: ShuttlePreset[] = [
	{ brand: 'Thành Công', tubePrice: 300000 },
	{ brand: 'Dabata', tubePrice: 260000 },
	{ brand: 'Hải Yến', tubePrice: 270000 },
];

const DEFAULT_INPUT_VALUES: Omit<SessionInput, 'isoDate'> = {
	hoursPlayed: 2,
	courtFee: 280000,
	shuttleBrand: 'Thành Công',
	tubePrice: 300000,
	shuttlesUsed: 5,
	waterFee: 40000,
	waterPayerId: ORGANIZER_ID,
	femaleCap: 50000,
};

interface SessionCostFormProps {
	input: SessionInput;
	onChange: (patch: Partial<SessionInput>) => void;
	participants: Player[];
}

export default function SessionCostForm({ input, onChange, participants }: SessionCostFormProps) {
	const shuttleUnit = input.tubePrice / SHUTTLES_PER_TUBE;
	const shuttleTotalCost = shuttleUnit * input.shuttlesUsed;
	const weekday = getWeekdayVN(input.isoDate);

	function handleReset() {
		onChange(DEFAULT_INPUT_VALUES);
	}

	return (
		<div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-gray-100 flex flex-col gap-5">
			{/* Header */}
			<div className="flex items-center justify-between pb-1">
				<div className="flex items-center gap-2.5">
					<span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#d1fae5] text-xs font-bold text-[#047857]">
						1
					</span>
					<h2 className="text-base font-bold text-gray-900 tracking-tight">Thông số chi phí buổi chơi</h2>
				</div>
				<button
					type="button"
					onClick={handleReset}
					className="flex items-center gap-1.5 text-xs font-semibold text-[#059669] hover:text-[#047857] transition-colors"
				>
					<RotateCcw className="size-3.5" />
					Khôi phục mẫu ví dụ
				</button>
			</div>

			{/* Row 1: Date + Hours */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{/* Ngày chơi */}
				<div className="flex flex-col gap-1.5">
					<Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
						NGÀY CHƠI (DD/MM/YYYY)
					</Label>
					<div className="flex items-center gap-2">
						<div className="relative flex-1">
							<CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
							<Input
								type="date"
								value={input.isoDate}
								onChange={(e) => e.target.value && onChange({ isoDate: e.target.value })}
								className="pl-9 h-10 font-semibold text-gray-800 rounded-lg border-gray-200"
							/>
						</div>
						{weekday && (
							<span className="shrink-0 rounded-md bg-[#dcfce7] px-3 py-2 text-xs font-bold text-[#15803d] border border-[#86efac]">
								{weekday}
							</span>
						)}
					</div>
				</div>

				{/* Số giờ chơi */}
				<div className="flex flex-col gap-1.5">
					<Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
						SỐ GIỜ CHƠI
					</Label>
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
				{/* 1. Tiền thuê sân */}
				<div className="flex flex-col gap-1.5">
					<Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
						1. TIỀN THUÊ SÂN (VNĐ)
					</Label>
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

				{/* 5. Mức trần ưu tiên nữ */}
				<div className="flex flex-col gap-1.5">
					<Label className="text-[11px] font-bold uppercase tracking-wider text-[#db2777]">
						5. MỨC TRẦN ƯU TIÊN NỮ (TỐI ĐA)
					</Label>
					<div className="relative">
						<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-[#ec4899]">
							♀
						</span>
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
						<span className="text-[11px] text-gray-400 italic">Áp dụng cả Nữ cố định &amp; vãng lai</span>
					</div>
				</div>
			</div>

			{/* Chi phí cầu lông (Card vàng cam) */}
			<div className="rounded-xl border border-[#fde68a] bg-[#fffdf0] p-4 flex flex-col gap-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex items-center gap-1.5 text-xs font-bold text-[#b45309] uppercase tracking-wide">
						<Feather className="size-4 text-[#d97706]" />
						<span>2 &amp; 3. CHI PHÍ CẦU LÔNG ({SHUTTLES_PER_TUBE} QUẢ / ỐNG)</span>
					</div>
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="text-[11px] text-gray-500">Chọn nhanh:</span>
						{SHUTTLE_PRESETS.map((preset) => (
							<button
								key={preset.brand}
								type="button"
								onClick={() => onChange({ shuttleBrand: preset.brand, tubePrice: preset.tubePrice })}
								className={cn(
									'rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-all',
									input.shuttleBrand === preset.brand && input.tubePrice === preset.tubePrice
										? 'bg-[#fef3c7] border-[#f59e0b] text-[#92400e]'
										: 'bg-white border-gray-200 text-gray-600 hover:bg-amber-50',
								)}
							>
								{preset.brand} ({preset.tubePrice / 1000}k)
							</button>
						))}
					</div>
				</div>

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					{/* Tên loại cầu */}
					<div className="flex flex-col gap-1">
						<Label className="text-[11px] font-medium text-gray-600">Tên loại cầu</Label>
						<Input
							value={input.shuttleBrand}
							onChange={(e) => onChange({ shuttleBrand: e.target.value })}
							placeholder="VD: Thành Công"
							className="h-9 bg-white border-gray-200 font-medium"
						/>
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
							<span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
								đ/ống
							</span>
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
					<span className="font-bold text-[#b45309] text-sm">
						= {formatVND(shuttleTotalCost)}
					</span>
				</div>
			</div>

			{/* Tiền nước lọc (Card xanh dương) */}
			<div className="rounded-xl border border-[#bfdbfe] bg-[#f0f7ff] p-4 flex flex-col gap-3">
				<div className="flex items-center gap-1.5 text-xs font-bold text-[#1d4ed8] uppercase tracking-wide">
					<span className="text-sm">🚰</span>
					<span>4. TIỀN NƯỚC LỌC</span>
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
							className="w-full h-10 bg-white rounded-lg border-gray-200"
						>
							<NativeSelectOption value={ORGANIZER_ID}>Tôi / Quỹ CLB mua (Tính vào tổng chi phí)</NativeSelectOption>
							{participants.map((p) => (
								<NativeSelectOption key={p.id} value={p.id}>
									{p.name}
								</NativeSelectOption>
							))}
						</NativeSelect>
						<p className="text-[11px] text-gray-500">
							{input.waterPayerId !== ORGANIZER_ID
								? 'Nếu thành viên mua, tiền nước sẽ được trừ thẳng vào phí của người đó.'
								: 'Nếu thành viên mua, tiền nước sẽ được trừ thẳng vào phí của người đó.'}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
