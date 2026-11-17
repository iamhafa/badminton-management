import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '../types/database.type';

const envSchema = z.object({
  url: z.url(),
  publishableKey: z.string().min(1),
});

/**
 * Lớp cơ sở cho các class API. Chỉ chia sẻ kết nối Supabase cho lớp con;
 * `protected` nên code bên ngoài không lấy được client qua `CourtApi.db`...
 * Khởi tạo lười: chỉ tạo client khi có lệnh đầu tiên tới database, để build/prerender không đòi biến môi trường.
 */
export abstract class SupabaseApi {
  private static client: SupabaseClient<Database>;

  protected static get db(): SupabaseClient<Database> {
    if (!SupabaseApi.client) {
      // Phải viết đủ tên biến (không dùng process.env[key]) để Next.js thay giá trị lúc build.
      const env = envSchema.safeParse({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      });
      if (!env.success) {
        throw new Error(
          'Thiếu cấu hình Supabase trong .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
        );
      }
      SupabaseApi.client = createClient<Database>(env.data.url, env.data.publishableKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        }, // app chưa có đăng nhập
      });
    }

    return SupabaseApi.client;
  }

  /** Supabase trả lỗi trong `{ error }` thay vì ném ra; hàm này ném lỗi để TanStack Query bắt được. */
  protected static throwIfError(error: { message: string } | null): void {
    if (!error) return;
    throw error instanceof Error ? error : new Error(error.message);
  }

  public static isNetworkError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(message);
  }
}
