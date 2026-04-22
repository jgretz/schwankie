import {info, warn, error} from './log';

interface UpdateConfig {
  remote: string;
  branch: string;
  repoDir: string;
}

interface UpdateResult {
  updated: boolean;
  previousSha?: string;
}

interface ShellResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function parse(result: {exitCode: number; stdout: Buffer; stderr: Buffer}): ShellResult {
  return {
    exitCode: result.exitCode,
    stdout: result.stdout.toString().trim(),
    stderr: result.stderr.toString().trim(),
  };
}

export async function checkForUpdates(config: UpdateConfig): Promise<UpdateResult> {
  const {remote, branch, repoDir} = config;

  const fetchResult = parse(
    await Bun.$`git fetch ${remote} ${branch}`.cwd(repoDir).quiet().nothrow(),
  );
  if (fetchResult.exitCode !== 0) {
    error('git fetch failed', {stderr: fetchResult.stderr});
    return {updated: false};
  }

  const localResult = parse(
    await Bun.$`git rev-parse HEAD`.cwd(repoDir).quiet().nothrow(),
  );
  const remoteRef = `${remote}/${branch}`;
  const remoteResult = parse(
    await Bun.$`git rev-parse ${remoteRef}`.cwd(repoDir).quiet().nothrow(),
  );

  if (localResult.exitCode !== 0 || remoteResult.exitCode !== 0) {
    error('Failed to resolve SHAs', {
      local: localResult.stderr,
      remote: remoteResult.stderr,
    });
    return {updated: false};
  }

  const localSha = localResult.stdout;
  const remoteSha = remoteResult.stdout;

  if (localSha === remoteSha) {
    return {updated: false};
  }

  info('Update available', {from: localSha.slice(0, 8), to: remoteSha.slice(0, 8)});
  return {updated: true, previousSha: localSha};
}

export async function applyUpdate(config: UpdateConfig): Promise<void> {
  const {remote, branch, repoDir} = config;
  const remoteRef = `${remote}/${branch}`;

  info('Checking out latest release');
  const checkout = parse(
    await Bun.$`git checkout -B ${branch} ${remoteRef}`.cwd(repoDir).quiet().nothrow(),
  );
  if (checkout.exitCode !== 0) {
    throw new Error(`git checkout failed: ${checkout.stderr}`);
  }

  info('Running bun install');
  const install = parse(
    await Bun.$`bun install`.cwd(repoDir).quiet().nothrow(),
  );
  if (install.exitCode !== 0) {
    throw new Error(`bun install failed: ${install.stderr}`);
  }

  info('Running type-check');
  const typecheck = parse(
    await Bun.$`bun run typecheck`.cwd(repoDir).quiet().nothrow(),
  );
  if (typecheck.exitCode !== 0) {
    throw new Error(`type-check failed: ${typecheck.stdout || typecheck.stderr}`);
  }

  info('Update applied successfully');
}

export async function rollback(config: UpdateConfig, sha: string): Promise<void> {
  const {branch, repoDir} = config;

  warn('Rolling back', {sha: sha.slice(0, 8)});

  const checkout = parse(
    await Bun.$`git checkout -B ${branch} ${sha}`.cwd(repoDir).quiet().nothrow(),
  );
  if (checkout.exitCode !== 0) {
    error('Rollback checkout failed', {stderr: checkout.stderr});
  }

  const install = parse(
    await Bun.$`bun install`.cwd(repoDir).quiet().nothrow(),
  );
  if (install.exitCode !== 0) {
    error('Rollback bun install failed', {stderr: install.stderr});
  }

  if (checkout.exitCode === 0 && install.exitCode === 0) {
    info('Rollback complete');
  } else {
    error('Rollback failed');
  }
}
