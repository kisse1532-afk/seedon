import { createClient } from "@supabase/supabase-js";

// anon/publishable 키는 공개용으로 설계된 키라 fallback으로 하드코딩해도 안전함
// (RLS 정책이 실제 데이터 접근을 통제함). service role 키는 절대 여기 두지 않는다.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ssxxqiwlywcgmgkdgmtz.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_n7WGjrvj1vpLeG1qsdS8kw_ppUgzudu";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
