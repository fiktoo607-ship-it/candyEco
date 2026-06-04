const path = require('path');

function installLockfileShim() {
  const nextVersion = require('next/package.json').version;
  if (!/^16\./.test(nextVersion)) {
    return;
  }

  const swcPackages = [
    '@next/swc-win32-x64-msvc',
    '@next/swc-win32-arm64-msvc',
    '@next/swc-darwin-x64',
    '@next/swc-darwin-arm64',
    '@next/swc-linux-x64-gnu',
    '@next/swc-linux-x64-musl',
    '@next/swc-linux-arm64-gnu',
    '@next/swc-linux-arm64-musl',
  ];

  for (const pkg of swcPackages) {
    try {
      const mod = require(pkg);
      if (typeof mod.lockfileTryAcquireSync !== 'function') {
        mod.lockfileTryAcquireSync = function lockfileTryAcquireSync(filePath, content) {
          try {
            if (typeof mod.lockfileTryAcquire === 'function') {
              const result = mod.lockfileTryAcquire(filePath, content);
              if (result && typeof result.then === 'function') {
                throw new Error('async lockfile acquire is not supported by this compatibility shim');
              }
              return result;
            }
          } catch (err) {
            throw err;
          }

          return null;
        };
      }
      if (typeof mod.lockfileUnlockSync !== 'function') {
        mod.lockfileUnlockSync = function lockfileUnlockSync(lockfile) {
          if (typeof mod.lockfileUnlock === 'function') {
            return mod.lockfileUnlock(lockfile);
          }
          return undefined;
        };
      }
      break;
    } catch {
      // Try next package; only one will exist for this platform.
    }
  }
}

installLockfileShim();

const nextBin = path.join(require.resolve('next/package.json'), '..', 'dist', 'bin', 'next');
require(nextBin);

