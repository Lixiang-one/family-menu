import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

// SVG icon: bowl with chopsticks emoji-style, dark background
function makeSvg(size, maskable = false) {
  const pad = maskable ? Math.round(size * 0.12) : 0
  const inner = size - pad * 2
  const scale = inner / 100
  const ox = pad
  const oy = pad
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#1c1c1e"/>
  <g transform="translate(${ox}, ${oy}) scale(${scale})">
    <!-- chopsticks -->
    <line x1="30" y1="10" x2="55" y2="60" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <line x1="70" y1="10" x2="50" y2="60" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <!-- bowl -->
    <path d="M15 60 Q15 88 50 88 Q85 88 85 60 Z" fill="#fff" opacity="0.95"/>
    <path d="M15 60 Q50 72 85 60" fill="none" stroke="#1c1c1e" stroke-width="2" opacity="0.3"/>
    <!-- steam -->
    <path d="M38 48 Q42 40 38 32" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
    <path d="M50 44 Q54 36 50 28" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
    <path d="M62 48 Q66 40 62 32" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
  </g>
</svg>`
}

const sizes = [192, 512]

for (const size of sizes) {
  // regular
  await sharp(Buffer.from(makeSvg(size, false)))
    .png()
    .toFile(join(outDir, `icon-${size}.png`))
  console.log(`✓ icon-${size}.png`)

  // maskable (extra safe zone padding)
  await sharp(Buffer.from(makeSvg(size, true)))
    .png()
    .toFile(join(outDir, `icon-maskable-${size}.png`))
  console.log(`✓ icon-maskable-${size}.png`)
}

// apple-touch-icon (180x180, no rounding - iOS clips itself)
await sharp(Buffer.from(makeSvg(180, false)))
  .png()
  .toFile(join(__dirname, '..', 'public', 'apple-touch-icon.png'))
console.log('✓ apple-touch-icon.png')

console.log('\nAll icons generated.')
