'use client';

import { cn } from 'cn';
import { Feather, MapPin, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const SETTINGS_ITEMS = [
  { href: '/settings/groups', label: 'Nhóm của tôi', icon: UsersRound },
  { href: '/settings/courts', label: 'Sân cầu lông', icon: MapPin },
  { href: '/settings/shuttlecocks', label: 'Loại cầu', icon: Feather },
] as const;

/**
 * Khung chung của các trang Cài đặt: thanh tab chọn mục + nội dung trang.
 * Là Client Component vì cần `usePathname` để tô sáng tab đang mở, nên không export `metadata` từ file này được.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <nav aria-label="Mục cài đặt" className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-xs">
        {SETTINGS_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive: boolean = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                isActive ? 'bg-[#0a6c44] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
