export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

/** Config mínima para middleware Edge — solo vars NEXT_PUBLIC, sin Zod server. */
export function getMiddlewareSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for middleware",
    );
  }
  return { url, publishableKey };
}
