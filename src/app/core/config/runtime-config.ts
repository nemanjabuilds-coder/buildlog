export interface BuildLogRuntimeConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

declare global {
  interface Window {
    __BUILDLOG_CONFIG__?: Partial<BuildLogRuntimeConfig>;
  }
}

const config = typeof window === 'undefined' ? {} : (window.__BUILDLOG_CONFIG__ ?? {});

export const runtimeConfig: BuildLogRuntimeConfig = {
  supabaseUrl: config.supabaseUrl?.trim() ?? '',
  supabaseAnonKey: config.supabaseAnonKey?.trim() ?? '',
};

export const isSupabaseConfigured = (): boolean =>
  Boolean(runtimeConfig.supabaseUrl && runtimeConfig.supabaseAnonKey);
