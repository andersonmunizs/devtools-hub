import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const scanner = resolve('scripts/check-public-repo.mjs');
const directories: string[] = [];
const token = 'gh' + 'p_' + 'A'.repeat(36);
function fixture() {
  const path = mkdtempSync(join(tmpdir(), 'public-repo-test-'));
  directories.push(path);
  execFileSync('git', ['init', '--quiet'], { cwd: path });
  return path;
}
function git(path: string, ...args: string[]) {
  return execFileSync('git', args, { cwd: path, stdio: 'pipe' });
}
function commit(path: string) {
  git(
    path,
    '-c',
    'user.name=Synthetic Test',
    '-c',
    'user.email=synthetic@example.invalid',
    'commit',
    '--quiet',
    '-m',
    'Synthetic fixture',
  );
}
function scan(path: string) {
  return spawnSync(process.execPath, [scanner], {
    cwd: path,
    encoding: 'utf8',
  });
}
afterEach(() => {
  for (const path of directories.splice(0)) {
    if (!resolve(path).startsWith(join(resolve(tmpdir()), 'public-repo-test-')))
      throw new Error('Unexpected fixture cleanup path');
    rmSync(path, { recursive: true, force: true });
  }
});

describe('verificação pública de arquivos, index e histórico', () => {
  it('redige credencial presente no nome de arquivo do diagnóstico', () => {
    const path = fixture();
    writeFileSync(join(path, token + '.txt'), 'synthetic public content');
    const result = scan(path);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[redacted]');
    expect(result.stderr + result.stdout).not.toContain(token);
  });
  it('aceita fonte limpa e não expõe arquivo privado ignorado', () => {
    const path = fixture();
    writeFileSync(join(path, '.gitignore'), '.env\n');
    writeFileSync(join(path, '.env'), token);
    writeFileSync(join(path, 'app.txt'), 'synthetic public source');
    expect(scan(path).status).toBe(0);
  });
  it('recusa segredo em arquivo candidato e mantém o diagnóstico redigido', () => {
    const path = fixture();
    writeFileSync(join(path, 'app.txt'), token);
    const result = scan(path);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('github-token');
    expect(result.stderr + result.stdout).not.toContain(token);
  });
  it('recusa arquivo privado mesmo adicionado com force', () => {
    const path = fixture();
    writeFileSync(join(path, '.gitignore'), '.env\n');
    writeFileSync(join(path, '.env'), 'SYNTHETIC=value');
    git(path, 'add', '--force', '.env');
    expect(scan(path).stderr).toContain('private-file');
    expect(scan(path).status).toBe(1);
  });
  it('detecta segredo no index mesmo com working tree limpo', () => {
    const path = fixture();
    writeFileSync(join(path, 'app.txt'), token);
    git(path, 'add', 'app.txt');
    writeFileSync(join(path, 'app.txt'), 'clean');
    const result = scan(path);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('index: app.txt:1: github-token');
  });
  it('detecta segredo removido da ponta mas presente no histórico', () => {
    const path = fixture();
    writeFileSync(join(path, 'app.txt'), token);
    git(path, 'add', 'app.txt');
    commit(path);
    writeFileSync(join(path, 'app.txt'), 'clean');
    git(path, 'add', 'app.txt');
    commit(path);
    const result = scan(path);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('history: app.txt:1: github-token');
    expect(result.stderr + result.stdout).not.toContain(token);
  });
});
