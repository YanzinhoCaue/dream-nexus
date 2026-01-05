import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO ---
// Quando você criar sua conta no Supabase.com, você vai colocar as chaves aqui:
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zoxdgeawcsredbfpzcnd.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p-FavapNcOOKB-qm5iH8mQ_yn_r5SXV';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);