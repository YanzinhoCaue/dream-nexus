import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	throw new Error('Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local');
}

const isValidSupabaseUrl = (url) => {
	try {
		const parsedUrl = new URL(url);
		return parsedUrl.protocol === 'https:' && Boolean(parsedUrl.hostname);
	} catch {
		return false;
	}
};

if (!isValidSupabaseUrl(SUPABASE_URL)) {
	throw new Error('NEXT_PUBLIC_SUPABASE_URL inválida. Use uma URL HTTPS válida do seu projeto Supabase.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);