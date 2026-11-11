'use client';

import { useConnection } from '@/context/ConnectionContext';
import { cn } from 'cn';
import { Calculator, Cloud, CloudOff, History, LoaderCircle, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type TabKey = 'calculator' | 'history' | 'settings';
export type CloudStatus = 'connecting' | 'online' | 'offline';

const NAV_ITEMS = [
  { href: '/', label: 'Tính tiền buổi chơi', shortLabel: 'Tính tiền', icon: Calculator, key: 'calculator' },
  { href: '/history', label: 'Lịch sử các tuần', shortLabel: 'Lịch sử', icon: History, key: 'history' },
  { href: '/settings', label: 'Cài đặt chung', shortLabel: 'Cài đặt', icon: Settings, key: 'settings' },
] as const;

interface HeaderProps {
  cloudStatus?: CloudStatus;
  onRetryConnection?: () => void;
  historyCount?: number;
}

export default function Header(props: HeaderProps) {
  const pathname = usePathname();
  const connection = useConnection();

  const cloudStatus = props.cloudStatus ?? connection.cloudStatus;
  const onRetryConnection = props.onRetryConnection ?? connection.retryConnection;
  const historyCount = props.historyCount;

  const tabCounts: Record<TabKey, number | undefined> = {
    calculator: undefined,
    history: historyCount,
    settings: undefined,
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

      <div className="relative mx-auto flex max-w-6xl flex-col gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Brand + Cloud status */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-[#f6c343] p-1.5 shadow-sm">
            <Image
              src="/badminton-icon.png"
              alt="CLB Cầu Lông"
              width={40}
              height={40}
              className="size-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-base font-bold text-white tracking-tight truncate">CLB Cầu Lông</span>
              <CloudIndicator status={cloudStatus} onRetry={onRetryConnection} />
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-100/90 font-normal truncate">
              Công cụ chia tiền sân, cầu &amp; theo dõi lịch sử CLB
            </p>
          </div>
        </div>

        {/* Right: Tabs segmented control navigation */}
        <nav
          aria-label="Tabs"
          className="flex h-auto w-full sm:w-auto items-center justify-between sm:justify-start rounded-lg bg-[#075334] p-1 border border-emerald-600/40 gap-1 overflow-x-auto no-scrollbar"
        >
          {NAV_ITEMS.map(({ href, key, label, shortLabel, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' || pathname === '/calculator' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 sm:flex-none shrink-0 items-center justify-center gap-1 sm:gap-1.5 rounded-md px-2 sm:px-3 py-1.5 text-xs font-medium transition-all select-none',
                  isActive
                    ? 'bg-white text-gray-900 font-semibold shadow-sm'
                    : 'text-emerald-100 hover:text-white hover:bg-emerald-800/40',
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
                {tabCounts[key] !== undefined ? (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-[#0a6c44] text-white',
                    )}
                  >
                    {tabCounts[key]}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
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
