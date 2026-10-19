import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

/* 웹(lib/supabase.ts)과 같은 공개용 키를 쓴다.
   publishable 키는 공개해도 되게 만든 키다 — 실제로 무엇을 읽을 수 있는지는
   DB의 RLS 정책이 막는다. service role(비밀) 키는 앱에 절대 넣지 않는다:
   앱 파일은 누구나 풀어볼 수 있다. */
const SUPABASE_URL = "https://ssxxqiwlywcgmgkdgmtz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_n7WGjrvj1vpLeG1qsdS8kw_ppUgzudu";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
