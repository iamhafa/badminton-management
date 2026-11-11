import Header from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { ConnectionProvider } from '@/context/ConnectionContext';
import '@/styles/globals.css';
import { cn } from 'cn';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

// Inter có bộ ký tự tiếng Việt; gán vào --font-sans để shadcn dùng làm font mặc định.
const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin', 'vietnamese'],
});

export const metadata: Metadata = {
  title: 'CLB Cầu Lông - Quản lý chi phí',
  description: 'Tính tiền sân, cầu, nước và quản lý thành viên CLB cầu lông',
  icons: {
    icon: '/badminton-icon.png',
    apple: '/badminton-icon.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={cn('h-full antialiased font-sans', inter.variable)}>
      <body className="min-h-full flex flex-col">
        <ConnectionProvider>
          <ConfirmProvider>
            <div className="flex min-h-full flex-1 flex-col gap-0 bg-[#f0f4f8]">
              <Header />
              <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-3.5 sm:px-4 sm:py-6">{children}</main>
            </div>
          </ConfirmProvider>
        </ConnectionProvider>
        {/* App đang dùng giao diện sáng nên cố định theme="light" cho thông báo. */}
        <Toaster theme="dark" position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
