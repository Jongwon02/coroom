import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  // 개발 중 환경변수 누락을 빠르게 알아채기 위한 경고
  // eslint-disable-next-line no-console
  console.warn("Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)가 설정되지 않았습니다.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});
