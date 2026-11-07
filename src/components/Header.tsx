'use client';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/libs/utils';
import { Calculator, Cloud, CloudOff, History, LoaderCircle, Users } from 'lucide-react';

export type TabKey = 'calculator' | 'roster' | 'history';
export type CloudStatus = 'connecting' | 'online' | 'offline';

const TABS: { key: TabKey; label: string; icon: typeof Calculator }[] = [
	{ key: 'calculator', label: 'Tính tiền buổi chơi', icon: Calculator },
	{ key: 'roster', label: 'Thành viên CLB', icon: Users },
	{ key: 'history', label: 'Lịch sử các tuần', icon: History },
];

interface HeaderProps {
	cloudStatus: CloudStatus;
	onRetryConnection: () => void;
	rosterCount?: number;
	historyCount?: number;
}

export default function Header({ cloudStatus, onRetryConnection, rosterCount = 0, historyCount = 0 }: HeaderProps) {
	const tabCounts: Record<TabKey, number | undefined> = {
		calculator: undefined,
		roster: rosterCount,
		history: historyCount,
	};

	return (
		<header className="sticky top-0 z-20 w-full bg-[#0a6c44] shadow-md border-b border-[#085a38]">
			{/* Subtle diagonal pinstripe overlay */}
			<div
				className="pointer-events-none absolute inset-0 opacity-[0.08]"
				style={{
					backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 6px, transparent 6px, transparent 12px)',
				}}
			/>

			<div className="relative mx-auto flex max-w-6xl flex-col gap-3 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
				{/* Left: Brand + Cloud status */}
				<div className="flex items-center gap-3">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f6c343] text-lg shadow-sm font-bold text-emerald-950">
						🏸
					</div>
					<div className="flex flex-col">
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-base font-bold text-white tracking-tight">Vụt Cầu Lông</span>
							<CloudIndicator status={cloudStatus} onRetry={onRetryConnection} />
						</div>
						<p className="text-[11px] text-emerald-100/90 font-normal">
							Công cụ chia tiền sân, cầu &amp; theo dõi lịch sử CLB
						</p>
					</div>
				</div>

				{/* Right: Tabs segmented control */}
				<TabsList className="flex h-auto w-full sm:w-auto items-center justify-start rounded-lg bg-[#075334] p-1 border border-emerald-600/40 gap-1">
					{TABS.map(({ key, label, icon: Icon }) => (
						<TabsTrigger
							key={key}
							value={key}
							className={cn(
								'flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-emerald-100 transition-all',
								'hover:text-white',
								'data-active:bg-white data-active:text-gray-900 data-active:font-semibold data-active:shadow-sm',
							)}
						>
							<Icon className="size-3.5 shrink-0" />
							<span>{label}</span>
							{tabCounts[key] !== undefined && (
								<span className="inline-flex items-center justify-center rounded-full bg-[#0a6c44] data-active:bg-emerald-100 data-active:text-emerald-800 text-white px-1.5 py-0.2 text-[10px] font-bold">
									{tabCounts[key]}
								</span>
							)}
						</TabsTrigger>
					))}
				</TabsList>
			</div>
		</header>
	);
}

function CloudIndicator({ status, onRetry }: { status: CloudStatus; onRetry: () => void }) {
	if (status === 'connecting') {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-[#075334] px-2 py-0.5 text-[11px] text-emerald-200 border border-emerald-600/40">
				<LoaderCircle className="size-3 animate-spin text-emerald-300" />
				Đang kết nối...
			</span>
		);
	}
	if (status === 'online') {
		return (
			<span className="inline-flex items-center gap-1.5 rounded-full bg-[#075334] px-2.5 py-0.5 text-[11px] text-emerald-100 border border-emerald-600/40 font-medium">
				<Cloud className="size-3.5 text-emerald-400 shrink-0" />
				Đã kết nối Cloud (Firebase)
			</span>
		);
	}
	return (
		<button
			type="button"
			onClick={onRetry}
			className="inline-flex items-center gap-1 rounded-full bg-red-950/80 px-2 py-0.5 text-[11px] text-red-200 border border-red-500/50 hover:bg-red-900 transition-colors"
			title="Bấm để thử kết nối lại"
		>
			<CloudOff className="size-3" />
			Mất kết nối (thử lại)
		</button>
	);
}
