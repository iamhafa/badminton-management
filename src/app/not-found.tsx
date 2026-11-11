import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>404 - Không tìm thấy trang</CardTitle>
          <CardDescription>Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/" className={buttonVariants()}>
            Về trang chủ
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
