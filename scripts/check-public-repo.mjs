import { execFileSync } from 'node:child_process';
import { readFileSync, lstatSync, existsSync } from 'node:fs';

// Redacted diagnostics only. Never print matched credentials or file contents.
const git = (...args) =>
  execFileSync('git', args, { maxBuffer: 32 * 1024 * 1024 });
const findings = new Set();
const patterns = [
  [
    'private-key',
    /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/,
  ],
  [
    'github-token',
    /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/,
  ],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['slack-token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ['api-token', /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}\b/],
  [
    'credential-url',
    /\b(?:https?|postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s/:]+:[^\s/@]+@/,
  ],
  [
    'private-local-path',
    /(?:[A-Za-z]:[\\/]Users[\\/][^\s\\/]+[\\/]|\/Users\/[^\s/]+\/)/,
  ],
];
const privatePath =
  /(^|\/)(?:\.env(?:\..*)?|\.npmrc|\.pnpmrc|\.ssh|\.aws|\.codex|\.agents|\.tools|node_modules|dist|test-results|playwright-report|coverage)(\/|$)|\.(?:pem|key|p12|pfx|jks|keystore|zip|log|bak)$/i;
function scan(path, bytes, origin) {
  if (path.endsWith('/')) return;
  for (const [rule, pattern] of patterns) {
    if (pattern.test(path))
      findings.add(`${origin}: ${path}: sensitive-filename-${rule}`);
  }
  if (privatePath.test(path) && path !== '.env.example')
    findings.add(`${origin}: ${path}: private-file`);
  if (bytes.length > 2 * 1024 * 1024) {
    findings.add(`${origin}: ${path}: file-over-2MiB-review-required`);
    return;
  }
  if (bytes.includes(0)) return;
  const lines = bytes.toString('utf8').split('\n');
  lines.forEach((line, index) => {
    for (const [rule, pattern] of patterns) {
      if (pattern.test(line))
        findings.add(`${origin}: ${path}:${index + 1}: ${rule}`);
    }
  });
}
try {
  const paths = [
    ...new Set(
      git('ls-files', '--cached', '--others', '--exclude-standard', '-z')
        .toString('utf8')
        .split('\0')
        .filter(Boolean),
    ),
  ];
  for (const path of paths) {
    if (!existsSync(path)) continue;
    if (lstatSync(path).isSymbolicLink()) {
      findings.add(`worktree: ${path}: symlink-review-required`);
      continue;
    }
    if (lstatSync(path).isFile()) scan(path, readFileSync(path), 'worktree');
  }
  // Inspect staged bytes as well: a cleaned working file can still have a secret in the index.
  const indexPaths = git('ls-files', '--cached', '-z')
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
  for (const path of indexPaths) scan(path, git('show', `:${path}`), 'index');
  const objects = git('rev-list', '--objects', '--all')
    .toString('utf8')
    .trim()
    .split('\n')
    .filter(Boolean);
  let blobs = 0;
  for (const entry of objects) {
    const separator = entry.indexOf(' ');
    if (separator < 0) continue;
    const oid = entry.slice(0, separator);
    const path = entry.slice(separator + 1);
    if (git('cat-file', '-t', oid).toString('utf8').trim() !== 'blob') continue;
    blobs += 1;
    scan(path, git('cat-file', 'blob', oid), 'history');
  }
  for (const finding of findings) {
    // Filenames are untrusted too: redact token-shaped names and prevent log commands/newlines.
    let diagnostic = Array.from(finding, (char) =>
      char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 ? '?' : char,
    ).join('');
    for (const [, pattern] of patterns)
      diagnostic = diagnostic.replace(
        new RegExp(pattern.source, 'g'),
        '[redacted]',
      );
    console.error(diagnostic);
  }
  console.log(
    `Public repository check: ${paths.length} files, ${indexPaths.length} indexed files, ${blobs} reachable history blobs, ${findings.size} findings.`,
  );
  if (findings.size) process.exitCode = 1;
} catch {
  console.error(
    'Public repository check failed. Run inside the intended Git checkout; no scan result can be assumed.',
  );
  process.exitCode = 1;
}
