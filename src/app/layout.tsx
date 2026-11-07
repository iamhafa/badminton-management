import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/libs/utils';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="vi" className={cn('h-full antialiased font-sans', inter.variable)}>
      <body className="min-h-full flex flex-col">
        {children}
        {/* App đang dùng giao diện sáng nên cố định theme="light" cho thông báo. */}
        <Toaster theme="dark" position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
