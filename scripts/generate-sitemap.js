const { spawnSync } = require('node:child_process')
const { resolve } = require('node:path')

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['next-sitemap'],
  {
    cwd: resolve(__dirname, '..'),
    stdio: 'inherit',
  }
)

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status ?? 0)
