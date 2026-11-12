'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: VoidFunction }) {
  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight text-destructive">Lỗi hệ thống</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error.message || 'Đã xảy ra lỗi nghiêm trọng. Vui lòng tải lại trang.'}
          </p>
          <button
            onClick={() => reset()}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
