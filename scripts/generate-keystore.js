#!/usr/bin/env node
/**
 * Cross-platform Android keystore generator.
 * Delegates to the appropriate platform-specific script.
 *
 * Usage: node scripts/generate-keystore.js
 *        or via npm: npm run generate:keystore
 */

const { execSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const scriptsDir = __dirname;

const scriptName = isWindows ? 'generate-keystore.bat' : 'generate-keystore.sh';
const scriptPath = path.join(scriptsDir, scriptName);

console.log(`[generate-keystore] Running ${scriptName} from ${scriptsDir}...`);

try {
  if (isWindows) {
    execSync(`"${scriptPath}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: 'cmd.exe',
    });
  } else {
    execSync(`bash "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  }
  console.log('[generate-keystore] Done.');
} catch (err) {
  console.error('[generate-keystore] Script failed:', err.message);
  process.exit(1);
}