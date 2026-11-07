'use client';

import { buildMessengerText, describePayable, formatVND, sumRoundedPayable } from '@/libs/calculator';
import { cn, copyToClipboard } from '@/libs/utils';
import type { SessionBill } from '@/types/badminton';
import { CalendarDays, Check, ChevronDown, ChevronUp, Clock, Copy, Eye, LoaderCircle, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import RoleBadge from '../RoleBadge';

interface BillSummaryCardProps {
	bill: SessionBill;
	onSave: () => Promise<void>;
	cloudOnline: boolean;
}

export default function BillSummaryCard({ bill, onSave, cloudOnline }: BillSummaryCardProps) {
	const [copied, setCopied] = useState(false);
	const [saving, setSaving] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);

	const hasPlayers = bill.totalCount > 0;
	const collected = sumRoundedPayable(bill);
	const avgPerPerson = hasPlayers ? Math.round(bill.totalCost / bill.totalCount) : 0;
	const isCapInEffect =
		bill.maleCount > 0 && bill.femaleCount > 0 && bill.roundedFemaleUnit < bill.roundedMaleUnit;

	async function handleCopy() {
		if (await copyToClipboard(buildMessengerText(bill))) {
			setCopied(true);
			toast.success('Đã copy bill, dán vào Messenger nhé!');
			setTimeout(() => setCopied(false), 2000);
		} else {
			toast.error('Không copy được, hãy thử lại.');
		}
	}

	async function handleSave() {
		setSaving(true);
		try {
			await onSave();
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="lg:sticky lg:top-20 flex flex-col overflow-hidden rounded-2xl shadow-lg border border-gray-200/80 bg-white">
			{/* Top Dark Header Card */}
			<div className="bg-[#0e241c] p-4 sm:p-5 text-white flex flex-col gap-3.5">
				{/* Header tag + hours */}
				<div className="flex items-center justify-between">
					<span className="rounded-full bg-[#0d3b2f] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#34d399] border border-[#165c49]">
						BẢNG TÍNH CHI TIẾT
					</span>
					<span className="flex items-center gap-1.5 rounded-full bg-[#0d3b2f] px-2.5 py-1 text-[11px] font-semibold text-[#34d399] border border-[#165c49]">
						<Clock className="size-3" />
						{bill.hoursPlayed} tiếng
					</span>
				</div>

				{/* Date row */}
				<div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
					<CalendarDays className="size-4 text-[#34d399]" />
					<span>{bill.title || 'Chưa chọn ngày'}</span>
				</div>

				{/* Total cost + Average */}
				<div className="flex items-baseline justify-between pt-0.5">
					<div>
						<div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
							TỔNG CHI PHÍ BUỔI CHƠI
						</div>
						<div className="text-3xl font-black tracking-tight text-white mt-0.5">
							{formatVND(bill.totalCost)}
						</div>
					</div>
					{hasPlayers && (
						<div className="text-right">
							<div className="text-[10px] font-medium text-gray-400">Trung bình / người</div>
							<div className="text-base font-bold text-[#34d399] mt-0.5">
								{formatVND(avgPerPerson)}
							</div>
						</div>
					)}
				</div>

				{/* 3 Cost boxes */}
				<div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
					<div className="flex flex-col items-center justify-center rounded-lg bg-[#16382c] px-1 sm:px-2 py-2 text-center border border-[#204a3c]">
						<span className="text-[9px] sm:text-[10px] text-gray-400 leading-tight">Tiền sân ({bill.hoursPlayed}h)</span>
						<span className="text-[11px] sm:text-xs font-bold text-white mt-0.5">{formatVND(bill.courtFee)}</span>
					</div>
					<div className="flex flex-col items-center justify-center rounded-lg bg-[#16382c] px-1 sm:px-2 py-2 text-center border border-[#204a3c]">
						<span className="text-[9px] sm:text-[10px] text-gray-400 leading-tight truncate w-full">
							{bill.shuttleBrand || 'Cầu'} ({bill.shuttlesUsed}q)
						</span>
						<span className="text-[11px] sm:text-xs font-bold text-[#facc15] mt-0.5">
							{formatVND(bill.shuttleTotalCost)}
						</span>
					</div>
					<div className="flex flex-col items-center justify-center rounded-lg bg-[#16382c] px-1 sm:px-2 py-2 text-center border border-[#204a3c]">
						<span className="text-[9px] sm:text-[10px] text-gray-400 leading-tight">Nước lọc</span>
						<span className="text-[11px] sm:text-xs font-bold text-[#38bdf8] mt-0.5">{formatVND(bill.waterFee)}</span>
					</div>
				</div>
			</div>

			{/* Bottom White Details Card */}
			<div className="p-4 sm:p-5 flex flex-col gap-4">
				{/* 2 Rate boxes */}
				{hasPlayers && (
					<div className="grid grid-cols-2 gap-2.5">
						{/* Box Nữ */}
						<div className="flex flex-col justify-between rounded-xl border border-pink-200/80 bg-[#fff5f8] p-3 shadow-xs">
							<div className="flex items-center justify-between gap-1">
								<span className="text-[11px] font-extrabold uppercase text-[#be185d]">MỨC ĐÓNG NỮ</span>
								<span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-[#be185d]">
									{isCapInEffect ? `Tối đa ${bill.femaleCap / 1000}k` : 'Chia đều'}
								</span>
							</div>
							<div className="my-1.5 text-2xl font-black text-gray-900 tracking-tight">
								{bill.femaleCount ? formatVND(bill.roundedFemaleUnit) : '—'}
							</div>
							<div className="text-[11px] text-gray-500 font-medium">
								{bill.femaleCount > 0
									? `${bill.femaleCount} Nữ (${bill.playerBreakdowns.filter((p) => p.gender === 'FEMALE' && p.type === 'REGULAR').length} Cố định${bill.playerBreakdowns.filter((p) => p.gender === 'FEMALE' && p.type === 'GUEST').length > 0 ? `, ${bill.playerBreakdowns.filter((p) => p.gender === 'FEMALE' && p.type === 'GUEST').length} vãng lai` : ''})`
									: '0 Nữ'}
							</div>
						</div>

						{/* Box Nam */}
						<div className="flex flex-col justify-between rounded-xl border border-blue-200/80 bg-[#f4f9ff] p-3 shadow-xs">
							<div className="flex items-center justify-between gap-1">
								<span className="text-[11px] font-extrabold uppercase text-[#1d4ed8]">MỨC ĐÓNG NAM</span>
								<span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#1d4ed8]">
									{isCapInEffect ? 'Chia phần còn lại' : 'Chia đều'}
								</span>
							</div>
							<div className="my-1.5 text-2xl font-black text-gray-900 tracking-tight">
								{bill.maleCount ? formatVND(bill.roundedMaleUnit) : '—'}
							</div>
							<div className="text-[11px] text-gray-500 font-medium truncate">
								{bill.maleCount > 0
									? `${bill.maleCount} Nam (${bill.playerBreakdowns.filter((p) => p.gender === 'MALE' && p.type === 'REGULAR').length} Cố định${bill.playerBreakdowns.filter((p) => p.gender === 'MALE' && p.type === 'GUEST').length > 0 ? `, ${bill.playerBreakdowns.filter((p) => p.gender === 'MALE' && p.type === 'GUEST').length} vãng lai` : ''})`
									: '0 Nam'}
							</div>
						</div>
					</div>
				)}

				{/* Player Breakdown list */}
				<div>
					{hasPlayers ? (
						<>
							<div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
								<span>CHI TIẾT TỪNG NGƯỜI CHƠI</span>
								<span className="text-[#059669]">SỐ TIỀN CẦN ĐÓNG</span>
							</div>
							<ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
								{bill.playerBreakdowns.map((p) => (
									<li key={p.id} className="flex items-center justify-between py-2 text-sm">
										<div className="flex items-center gap-1.5 min-w-0 pr-2">
											<span className="font-semibold text-gray-900 truncate">{p.name}</span>
											<RoleBadge role={p.role} />
											<span
												className={cn(
													'shrink-0 rounded px-1.5 py-0.2 text-[10px] font-bold',
													p.gender === 'MALE'
														? 'bg-blue-100 text-blue-700'
														: 'bg-pink-100 text-pink-700',
												)}
											>
												{p.gender === 'MALE' ? 'Nam' : 'Nữ'}
											</span>
											{p.type === 'GUEST' && (
												<span className="shrink-0 text-[10px] text-gray-400 italic">vãng lai</span>
											)}
											{p.waterCredit > 0 && (
												<span className="shrink-0 text-[10px] font-medium text-amber-600">
													(ứng {formatVND(p.waterCredit)})
												</span>
											)}
										</div>
										<span
											className={cn(
												'shrink-0 font-bold',
												p.roundedPayable < 0 ? 'text-amber-600' : 'text-gray-900',
											)}
										>
											{describePayable(p.roundedPayable)}
										</span>
									</li>
								))}
							</ul>
							{/* Rounding difference note */}
							{(() => {
								const diff = collected - bill.totalCost;
								return diff !== 0 ? (
									<p className="mt-1 text-[11px] text-gray-400">
										Thực thu: {formatVND(collected)} ({diff > 0 ? 'dư' : 'thiếu'}{' '}
										{formatVND(Math.abs(diff))})
									</p>
								) : null;
							})()}
						</>
					) : (
						<p className="text-center py-4 text-xs text-gray-400">
							Chọn thành viên hoặc thêm vãng lai để tính tiền.
						</p>
					)}
				</div>

				{/* 2 Action Buttons */}
				<div className="grid grid-cols-2 gap-2 pt-1">
					<button
						type="button"
						onClick={handleCopy}
						disabled={!hasPlayers}
						className={cn(
							'flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all',
							hasPlayers
								? 'bg-[#059669] hover:bg-[#047857] active:bg-[#065f46]'
								: 'bg-gray-300 cursor-not-allowed text-gray-500',
						)}
					>
						{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
						{copied ? 'Đã copy' : 'Copy Bill gửi nhóm'}
					</button>

					<button
						type="button"
						onClick={handleSave}
						disabled={!hasPlayers || saving || !cloudOnline}
						title={!cloudOnline ? 'Chưa kết nối Cloud' : undefined}
						className={cn(
							'flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all',
							hasPlayers && !saving && cloudOnline
								? 'bg-[#15232d] hover:bg-[#1f3240] active:bg-[#0b141a]'
								: 'bg-gray-300 cursor-not-allowed text-gray-500',
						)}
					>
						{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
						Lưu vào Lịch sử CLB
					</button>
				</div>

				{/* Messenger preview accordian */}
				<div className="border-t border-gray-100 pt-2">
					<button
						type="button"
						onClick={() => setPreviewOpen((v) => !v)}
						className="flex w-full items-center justify-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-800 transition-colors"
					>
						<Eye className="size-3.5 text-gray-400" />
						<span>Xem trước nội dung tin nhắn gửi nhóm Messenger</span>
						{previewOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
					</button>
					{previewOpen && hasPlayers && (
						<div className="mt-2.5">
							<pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs leading-relaxed text-gray-700 font-mono">
								{buildMessengerText(bill)}
							</pre>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
