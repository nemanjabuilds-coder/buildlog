import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../models/database.types';
import { isSupabaseConfigured, runtimeConfig } from '../config/runtime-config';

export const supabaseClient: SupabaseClient<Database> | null = isSupabaseConfigured()
  ? createClient<Database>(runtimeConfig.supabaseUrl, runtimeConfig.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;
