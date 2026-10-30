import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';

// Disable CLI telemetry for every project command, including local development.
const require = createRequire(import.meta.url);
const manifestPath = require.resolve('astro/package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const bin =
  typeof manifest.bin === 'string' ? manifest.bin : manifest.bin.astro;
const child = spawn(
  process.execPath,
  [resolve(dirname(manifestPath), bin), ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
  },
);
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
