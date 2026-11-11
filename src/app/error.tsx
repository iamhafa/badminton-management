'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Đã xảy ra lỗi</CardTitle>
          <CardDescription>{error.message || 'Hệ thống gặp sự cố không mong muốn. Vui lòng thử lại.'}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={() => reset()}>
            <RotateCcw /> Thử lại
          </Button>
          <Link href="/" className={buttonVariants({ variant: 'outline' })}>
            Về trang chủ
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
