import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '../types/database.type';

/**
 * Lớp cơ sở cho các class API. Chỉ chia sẻ kết nối Supabase cho lớp con;
 * `protected` nên code bên ngoài không lấy được client qua `CourtApi.database`...
 * Khởi tạo lười: chỉ tạo client khi có lệnh đầu tiên tới database, để build/prerender không đòi biến môi trường.
 */
export abstract class SupabaseClientApi {
  private static client?: SupabaseClient<Database>;
  private static readonly envSchema = z.object({
    url: z.url(),
    publishableKey: z.string().min(1),
  });

  protected static get database(): SupabaseClient<Database> {
    if (!this.client) {
      const env = this.envSchema.safeParse({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      });

      if (!env.success) {
        throw new Error(
          'Thiếu cấu hình Supabase trong .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
        );
      }

      this.client = createClient<Database>(env.data.url, env.data.publishableKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        db: {
          schema: 'public',
        },
      });
    }

    return this.client;
  }

  public static isNetworkError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(message);
  }
}
