import fs from 'node:fs'
import path from 'node:path'

const distDir = path.resolve(process.cwd(), 'dist')
const assetsDir = path.join(distDir, 'assets')

function fail(message) {
  console.error(`\n[verify:edurepo-build] ${message}`)
  process.exit(1)
}

if (!fs.existsSync(distDir)) {
  fail(`dist directory not found: ${distDir}`)
}

if (!fs.existsSync(assetsDir)) {
  fail(`dist/assets directory not found: ${assetsDir}`)
}

const jsFiles = fs
  .readdirSync(assetsDir)
  .filter((file) => file.endsWith('.js'))
  .map((file) => path.join(assetsDir, file))

if (!jsFiles.length) {
  fail('no built JavaScript assets found under dist/assets')
}

let bundleText = ''
for (const file of jsFiles) {
  bundleText += fs.readFileSync(file, 'utf8')
}

const routeHit = bundleText.includes('/edurepo') || bundleText.includes('"edurepo"')
const menuHit =
  bundleText.includes('EduRepo') || bundleText.includes('key:"edurepo"') || bundleText.includes("key:'edurepo'")

if (!routeHit) {
  fail('missing /edurepo route token in built assets')
}

if (!menuHit) {
  fail('missing EduRepo navigation token in built assets')
}

console.log('[verify:edurepo-build] OK: detected EduRepo route/menu tokens in build output')
