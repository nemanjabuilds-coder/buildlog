import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = resolve(projectRoot, 'public');
const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() ?? '';
const config = { supabaseUrl, supabaseAnonKey };

await mkdir(publicDir, { recursive: true });
await writeFile(
  resolve(publicDir, 'runtime-config.js'),
  `window.__BUILDLOG_CONFIG__ = Object.freeze(${JSON.stringify(config)});\n`,
  { mode: 0o600 },
);
process.stdout.write(
  `BuildLog runtime config: ${supabaseUrl && supabaseAnonKey ? 'Supabase configured' : 'awaiting Supabase setup'}\n`,
);
