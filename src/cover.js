// 外部画像に依存しない、ゲームごとの抽象的なカバーアートを生成する。
const hashSeed = (text) => {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const randomFrom = (seed) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let value = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296
}

const n = (value) => Number(value.toFixed(2))

function spaceArt(w, h, r, accent, second) {
  const stars = Array.from({ length: 80 }, () => {
    const x = n(r() * w)
    const y = n(r() * h)
    const radius = n(0.4 + r() * 1.7)
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="#fff" opacity="${n(0.25 + r() * 0.7)}"/>`
  }).join('')
  const px = n(w * (0.58 + r() * 0.16))
  const py = n(h * (0.38 + r() * 0.14))
  const pr = n(Math.min(w, h) * 0.27)
  return `
    <circle cx="${px}" cy="${py}" r="${pr * 2.6}" fill="url(#glow)" opacity="0.5"/>
    ${stars}
    <circle cx="${px}" cy="${py}" r="${pr}" fill="url(#planet)"/>
    <ellipse cx="${px}" cy="${py}" rx="${n(pr * 1.85)}" ry="${n(pr * 0.32)}" fill="none" stroke="${accent}" stroke-width="${n(pr * 0.06)}" opacity="0.75" transform="rotate(-20 ${px} ${py})"/>
    <path d="M${n(w * 0.05)} ${n(h * 0.78)} Q${n(w * 0.4)} ${n(h * 0.5)} ${n(w * 0.92)} ${n(h * 0.7)}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.35"/>
    <circle cx="${n(w * 0.16)}" cy="${n(h * 0.24)}" r="${n(pr * 0.16)}" fill="${second}" opacity="0.7"/>`
}

function neonArt(w, h, r, accent, second) {
  const horizon = h * 0.58
  const center = w * (0.42 + r() * 0.16)
  const sunR = Math.min(w, h) * 0.23
  const stripes = Array.from({ length: 7 }, (_, i) => {
    const y = horizon - sunR * 0.55 + (i * sunR) / 6
    return `<rect x="${n(center - sunR)}" y="${n(y)}" width="${n(sunR * 2)}" height="${n(1 + i * 1.3)}" fill="${second}" opacity="0.85"/>`
  }).join('')
  const vertical = Array.from({ length: 12 }, (_, i) => {
    const x = (w / 11) * i
    return `<line x1="${n(center)}" y1="${n(horizon)}" x2="${n(x)}" y2="${h}" stroke="${accent}" stroke-width="1" opacity="0.28"/>`
  }).join('')
  const horizontal = Array.from({ length: 9 }, (_, i) => {
    const y = horizon + (h - horizon) * Math.pow((i + 1) / 9, 1.9)
    return `<line x1="0" y1="${n(y)}" x2="${w}" y2="${n(y)}" stroke="${accent}" stroke-width="1" opacity="${n(0.12 + i * 0.035)}"/>`
  }).join('')
  const peaks = Array.from({ length: 7 }, (_, i) => {
    const x = (w / 6) * i
    return `${n(x)},${n(horizon - 8 - r() * h * 0.13)}`
  }).join(' ')
  return `
    <circle cx="${n(center)}" cy="${n(horizon - sunR * 0.15)}" r="${n(sunR * 1.6)}" fill="url(#glow)" opacity="0.6"/>
    <circle cx="${n(center)}" cy="${n(horizon - sunR * 0.15)}" r="${n(sunR)}" fill="${accent}" opacity="0.9"/>
    ${stripes}
    <polygon points="0,${n(horizon)} ${peaks} ${w},${n(horizon)} ${w},${n(horizon + 4)} 0,${n(horizon + 4)}" fill="${second}" opacity="0.85"/>
    ${vertical}${horizontal}
    <line x1="0" y1="${n(horizon)}" x2="${w}" y2="${n(horizon)}" stroke="${accent}" stroke-width="2" opacity="0.8"/>`
}

function rainArt(w, h, r, accent, second) {
  const rain = Array.from({ length: 90 }, () => {
    const x = r() * w
    const y = r() * h
    const len = 12 + r() * 30
    return `<line x1="${n(x)}" y1="${n(y)}" x2="${n(x - len * 0.22)}" y2="${n(y + len)}" stroke="${accent}" stroke-width="${n(0.6 + r())}" opacity="${n(0.1 + r() * 0.35)}"/>`
  }).join('')
  const buildings = Array.from({ length: 9 }, (_, i) => {
    const bw = w / 8
    const bh = h * (0.16 + r() * 0.3)
    const x = i * bw - bw * 0.2
    return `<rect x="${n(x)}" y="${n(h - bh)}" width="${n(bw * 1.1)}" height="${n(bh)}" fill="${second}" opacity="0.75"/>`
  }).join('')
  const lights = Array.from({ length: 26 }, () => {
    const x = n(r() * w)
    const y = n(h * (0.6 + r() * 0.33))
    return `<circle cx="${x}" cy="${y}" r="${n(0.8 + r() * 1.6)}" fill="${accent}" opacity="${n(0.3 + r() * 0.5)}"/>`
  }).join('')
  return `
    <circle cx="${n(w * 0.72)}" cy="${n(h * 0.32)}" r="${n(h * 0.36)}" fill="url(#glow)" opacity="0.55"/>
    ${buildings}${lights}${rain}
    <path d="M${n(w * 0.18)} ${n(h * 0.82)} Q${n(w * 0.32)} ${n(h * 0.58)} ${n(w * 0.48)} ${n(h * 0.82)}" fill="${second}" opacity="0.95"/>
    <line x1="${n(w * 0.33)}" y1="${n(h * 0.69)}" x2="${n(w * 0.33)}" y2="${n(h * 0.98)}" stroke="#0b1020" stroke-width="3" opacity="0.8"/>
    <rect x="0" y="${n(h * 0.96)}" width="${w}" height="${n(h * 0.04)}" fill="#0b1020" opacity="0.85"/>`
}

function forestArt(w, h, r, accent, second) {
  const rays = Array.from({ length: 6 }, () => {
    const x = r() * w
    return `<path d="M${n(x)} 0 L${n(x + w * 0.08)} ${n(h * 0.75)} L${n(x + w * 0.18)} ${n(h * 0.75)} Z" fill="${accent}" opacity="0.06"/>`
  }).join('')
  const trees = Array.from({ length: 20 }, () => {
    const x = r() * w
    const th = h * (0.18 + r() * 0.4)
    const tw = th * 0.28
    const base = h * (0.72 + r() * 0.16)
    return `<path d="M${n(x)} ${n(base - th)} L${n(x + tw)} ${n(base)} L${n(x - tw)} ${n(base)} Z" fill="${second}" opacity="${n(0.35 + r() * 0.4)}"/>`
  }).join('')
  const fireflies = Array.from({ length: 22 }, () => {
    const x = r() * w
    const y = h * (0.4 + r() * 0.5)
    return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(1 + r() * 2)}" fill="${accent}" opacity="${n(0.4 + r() * 0.6)}"/>`
  }).join('')
  return `
    <circle cx="${n(w * 0.5)}" cy="${n(h * 0.22)}" r="${n(h * 0.4)}" fill="url(#glow)" opacity="0.5"/>
    ${rays}
    <path d="M0 ${n(h * 0.72)} Q${n(w * 0.28)} ${n(h * 0.56)} ${n(w * 0.55)} ${n(h * 0.7)} T${w} ${n(h * 0.62)} L${w} ${h} L0 ${h} Z" fill="${second}" opacity="0.5"/>
    ${trees}
    <path d="M${n(w * 0.42)} ${h} Q${n(w * 0.5)} ${n(h * 0.78)} ${n(w * 0.58)} ${h} Z" fill="#0a1a14" opacity="0.6"/>
    ${fireflies}`
}

function geometricArt(w, h, r, accent, second) {
  const shapes = Array.from({ length: 16 }, () => {
    const x = r() * w
    const y = r() * h
    const size = Math.min(w, h) * (0.06 + r() * 0.24)
    const kind = Math.floor(r() * 3)
    const opacity = n(0.12 + r() * 0.4)
    if (kind === 0) return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(size)}" fill="${r() > 0.5 ? accent : second}" opacity="${opacity}"/>`
    if (kind === 1) return `<rect x="${n(x)}" y="${n(y)}" width="${n(size * 1.4)}" height="${n(size * 1.4)}" fill="none" stroke="${accent}" stroke-width="${n(1 + r() * 3)}" opacity="${opacity}" transform="rotate(${n(r() * 90)} ${n(x)} ${n(y)})"/>`
    return `<path d="M${n(x)} ${n(y)} L${n(x + size)} ${n(y + size)} L${n(x - size)} ${n(y + size)} Z" fill="${second}" opacity="${opacity}"/>`
  }).join('')
  const cx = w * 0.52
  const cy = h * 0.48
  const rings = Array.from({ length: 4 }, (_, i) => {
    const rad = Math.min(w, h) * (0.12 + i * 0.09)
    return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rad)}" fill="none" stroke="${accent}" stroke-width="${n(2 - i * 0.3)}" opacity="${n(0.7 - i * 0.14)}"/>`
  }).join('')
  return `
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(Math.min(w, h) * 0.4)}" fill="url(#glow)" opacity="0.45"/>
    ${shapes}${rings}
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(Math.min(w, h) * 0.045)}" fill="${accent}"/>`
}

function horrorArt(w, h, r, accent, second) {
  const fog = Array.from({ length: 9 }, () => {
    const x = r() * w
    const y = h * (0.45 + r() * 0.5)
    return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(w * (0.12 + r() * 0.2))}" ry="${n(h * 0.06)}" fill="${second}" opacity="${n(0.1 + r() * 0.18)}"/>`
  }).join('')
  const dx = w * 0.5
  const dy = h * 0.56
  const dw = Math.min(w, h) * 0.2
  const dh = Math.min(w, h) * 0.36
  return `
    <circle cx="${n(w * 0.5)}" cy="${n(h * 0.28)}" r="${n(h * 0.34)}" fill="url(#glow)" opacity="0.22"/>
    ${fog}
    <rect x="${n(dx - dw / 2)}" y="${n(dy - dh / 2)}" width="${n(dw)}" height="${n(dh)}" rx="${n(dw * 0.4)}" fill="#08080d" stroke="${second}" stroke-width="2" opacity="0.95"/>
    <path d="M${n(dx - dw * 0.62)} ${n(dy + dh / 2)} L${n(dx)} ${n(h * 0.92)} L${n(dx + dw * 0.62)} ${n(dy + dh / 2)} Z" fill="${accent}" opacity="0.12"/>
    <circle cx="${n(dx - dw * 0.16)}" cy="${n(dy - dh * 0.08)}" r="${n(dw * 0.045)}" fill="${accent}"/>
    <circle cx="${n(dx + dw * 0.16)}" cy="${n(dy - dh * 0.08)}" r="${n(dw * 0.045)}" fill="${accent}"/>
    <path d="M${n(w * 0.08)} ${h} L${n(w * 0.2)} ${n(h * 0.7)} L${n(w * 0.34)} ${n(h * 0.82)} L${n(w * 0.48)} ${n(h * 0.6)} L${n(w * 0.66)} ${n(h * 0.85)} L${n(w * 0.86)} ${n(h * 0.66)} L${w} ${h} Z" fill="#05050a" opacity="0.9"/>`
}

function towerArt(w, h, r, accent, second) {
  const tw = Math.min(w, h) * 0.3
  const tx = w * 0.5
  const clouds = Array.from({ length: 14 }, () => {
    const x = r() * w
    const y = h * (0.12 + r() * 0.72)
    return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(w * (0.08 + r() * 0.16))}" ry="${n(h * 0.025)}" fill="${accent}" opacity="${n(0.06 + r() * 0.14)}"/>`
  }).join('')
  const platforms = Array.from({ length: 8 }, (_, i) => {
    const y = h * (0.18 + i * 0.1)
    const pw = tw * (1.5 - i * 0.08)
    return `<rect x="${n(tx - pw / 2)}" y="${n(y)}" width="${n(pw)}" height="${n(h * 0.022)}" fill="${accent}" opacity="${n(0.5 + i * 0.05)}"/>`
  }).join('')
  return `
    <circle cx="${n(w * 0.76)}" cy="${n(h * 0.22)}" r="${n(h * 0.1)}" fill="${accent}" opacity="0.65"/>
    <circle cx="${n(w * 0.76)}" cy="${n(h * 0.22)}" r="${n(h * 0.24)}" fill="url(#glow)" opacity="0.5"/>
    ${clouds}
    <rect x="${n(tx - tw / 2)}" y="${n(h * 0.12)}" width="${n(tw)}" height="${n(h * 0.88)}" fill="${second}" opacity="0.55"/>
    <rect x="${n(tx - tw / 2)}" y="${n(h * 0.12)}" width="${n(tw)}" height="${n(h * 0.88)}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.5"/>
    ${platforms}
    <path d="M${n(tx)} ${n(h * 0.1)} L${n(tx - tw * 0.24)} ${n(h * 0.17)} L${n(tx + tw * 0.24)} ${n(h * 0.17)} Z" fill="${accent}" opacity="0.85"/>`
}

function pixelArt(w, h, r, accent, second) {
  const cell = Math.max(10, Math.round(w / 22))
  const cols = Math.ceil(w / cell)
  const rows = Math.ceil(h / cell)
  const blocks = Array.from({ length: cols * rows }, (_, i) => {
    const x = (i % cols) * cell
    const y = Math.floor(i / cols) * cell
    if (r() > 0.62) return ''
    const color = r() > 0.72 ? accent : second
    return `<rect x="${n(x)}" y="${n(y)}" width="${n(cell - 1.5)}" height="${n(cell - 1.5)}" fill="${color}" opacity="${n(0.2 + r() * 0.5)}"/>`
  }).join('')
  const cx = w * 0.5
  const cy = h * 0.6
  const size = cell * 2
  return `
    ${blocks}
    <rect x="${n(cx - size * 2)}" y="${n(cy - size)}" width="${n(size * 4)}" height="${n(size * 2.4)}" rx="${n(size * 0.5)}" fill="${accent}" opacity="0.95"/>
    <circle cx="${n(cx - size * 0.8)}" cy="${n(cy + size * 0.2)}" r="${n(size * 0.22)}" fill="#0b1020"/>
    <circle cx="${n(cx + size * 0.8)}" cy="${n(cy + size * 0.2)}" r="${n(size * 0.22)}" fill="#0b1020"/>
    <path d="M${n(cx - size * 0.45)} ${n(cy + size * 0.85)} Q${n(cx)} ${n(cy + size * 1.3)} ${n(cx + size * 0.45)} ${n(cy + size * 0.85)}" fill="none" stroke="#0b1020" stroke-width="${n(size * 0.14)}" stroke-linecap="round"/>`
}

function fireworksArt(w, h, r, accent, second) {
  const bursts = Array.from({ length: 4 }, (_, i) => {
    const cx = w * (0.18 + r() * 0.64)
    const cy = h * (0.12 + r() * 0.42)
    const radius = Math.min(w, h) * (0.08 + r() * 0.1)
    const color = i % 2 === 0 ? accent : '#ffd166'
    const rays = Array.from({ length: 18 }, (_, j) => {
      const angle = (Math.PI * 2 * j) / 18
      const x1 = cx + Math.cos(angle) * radius * 0.25
      const y1 = cy + Math.sin(angle) * radius * 0.25
      const x2 = cx + Math.cos(angle) * radius
      const y2 = cy + Math.sin(angle) * radius
      return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${n(1 + r() * 1.5)}" opacity="${n(0.5 + r() * 0.5)}"/><circle cx="${n(x2)}" cy="${n(y2)}" r="1.6" fill="${color}"/>`
    }).join('')
    return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(radius * 1.4)}" fill="${color}" opacity="0.1"/>${rays}`
  }).join('')
  const stars = Array.from({ length: 40 }, () => `<circle cx="${n(r() * w)}" cy="${n(r() * h * 0.6)}" r="${n(0.5 + r())}" fill="#fff" opacity="${n(0.2 + r() * 0.5)}"/>`).join('')
  return `
    ${stars}${bursts}
    <path d="M0 ${n(h * 0.88)} Q${n(w * 0.3)} ${n(h * 0.8)} ${n(w * 0.62)} ${n(h * 0.89)} T${w} ${n(h * 0.86)} L${w} ${h} L0 ${h} Z" fill="${second}" opacity="0.8"/>
    <path d="M${n(w * 0.46)} ${h} L${n(w * 0.49)} ${n(h * 0.84)} L${n(w * 0.53)} ${n(h * 0.84)} L${n(w * 0.56)} ${h} Z" fill="#0a0510" opacity="0.9"/>`
}

function oceanArt(w, h, r, accent, second) {
  const horizon = h * 0.48
  const waves = Array.from({ length: 7 }, (_, i) => {
    const y = horizon + (h - horizon) * ((i + 1) / 8)
    const amp = 4 + i * 2.5
    return `<path d="M0 ${n(y)} Q${n(w * 0.25)} ${n(y - amp)} ${n(w * 0.5)} ${n(y)} T${w} ${n(y)}" fill="none" stroke="${i % 2 ? accent : second}" stroke-width="${n(1 + i * 0.35)}" opacity="${n(0.18 + i * 0.07)}"/>`
  }).join('')
  const glints = Array.from({ length: 26 }, () => {
    const x = n(w * (0.34 + r() * 0.32))
    const y = n(horizon + r() * (h - horizon))
    return `<line x1="${x}" y1="${y}" x2="${n(x + 6 + r() * 16)}" y2="${y}" stroke="${accent}" stroke-width="${n(0.8 + r())}" opacity="${n(0.2 + r() * 0.4)}"/>`
  }).join('')
  return `
    <circle cx="${n(w * 0.5)}" cy="${n(horizon - h * 0.12)}" r="${n(h * 0.1)}" fill="${accent}" opacity="0.85"/>
    <circle cx="${n(w * 0.5)}" cy="${n(horizon - h * 0.12)}" r="${n(h * 0.3)}" fill="url(#glow)" opacity="0.6"/>
    <line x1="0" y1="${n(horizon)}" x2="${w}" y2="${n(horizon)}" stroke="${accent}" stroke-width="1" opacity="0.4"/>
    ${waves}${glints}
    <path d="M${n(w * 0.42)} ${n(horizon + h * 0.16)} L${n(w * 0.58)} ${n(horizon + h * 0.16)} L${n(w * 0.54)} ${n(horizon + h * 0.22)} L${n(w * 0.46)} ${n(horizon + h * 0.22)} Z" fill="#08151c" opacity="0.9"/>
    <line x1="${n(w * 0.5)}" y1="${n(horizon + h * 0.02)}" x2="${n(w * 0.5)}" y2="${n(horizon + h * 0.16)}" stroke="#08151c" stroke-width="2"/>
    <path d="M${n(w * 0.5)} ${n(horizon + h * 0.03)} L${n(w * 0.58)} ${n(horizon + h * 0.14)} L${n(w * 0.5)} ${n(horizon + h * 0.13)} Z" fill="${accent}" opacity="0.7"/>`
}

function cityArt(w, h, r, accent, second) {
  const buildings = Array.from({ length: 14 }, (_, i) => {
    const bw = w / 12
    const bh = h * (0.2 + r() * 0.45)
    const x = i * bw - bw * 0.15
    const windows = Array.from({ length: 12 }, () => {
      const wx = x + bw * (0.12 + r() * 0.6)
      const wy = h - bh + h * (0.04 + r() * 0.82)
      if (wy > h - 4) return ''
      return `<rect x="${n(wx)}" y="${n(wy)}" width="${n(bw * 0.12)}" height="${n(bw * 0.16)}" fill="${accent}" opacity="${n(0.25 + r() * 0.6)}"/>`
    }).join('')
    return `<rect x="${n(x)}" y="${n(h - bh)}" width="${n(bw * 0.95)}" height="${n(bh)}" fill="${second}" opacity="0.8"/>${windows}`
  }).join('')
  const rain = Array.from({ length: 70 }, () => {
    const x = r() * w
    const y = r() * h
    return `<line x1="${n(x)}" y1="${n(y)}" x2="${n(x - 6)}" y2="${n(y + 16)}" stroke="${accent}" stroke-width="0.8" opacity="${n(0.08 + r() * 0.25)}"/>`
  }).join('')
  return `
    <circle cx="${n(w * 0.78)}" cy="${n(h * 0.2)}" r="${n(h * 0.09)}" fill="${accent}" opacity="0.7"/>
    <circle cx="${n(w * 0.78)}" cy="${n(h * 0.2)}" r="${n(h * 0.26)}" fill="url(#glow)" opacity="0.45"/>
    ${buildings}${rain}
    <rect x="${n(w * 0.06)}" y="${n(h * 0.64)}" width="${n(w * 0.88)}" height="${n(h * 0.18)}" fill="#06060c" opacity="0.75"/>
    <rect x="${n(w * 0.07)}" y="${n(h * 0.65)}" width="${n(w * 0.86)}" height="${n(h * 0.1)}" fill="${accent}" opacity="0.1"/>`
}

const artRenderers = {
  space: spaceArt,
  neon: neonArt,
  rain: rainArt,
  forest: forestArt,
  geometric: geometricArt,
  horror: horrorArt,
  tower: towerArt,
  pixel: pixelArt,
  fireworks: fireworksArt,
  ocean: oceanArt,
  city: cityArt,
}

function wrapSvg(width, height, palette, accent, inner) {
  const [base, second] = palette
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${base}"/><stop offset="1" stop-color="${second}"/></linearGradient>
<radialGradient id="glow"><stop stop-color="${accent}" stop-opacity="0.55"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
<radialGradient id="planet"><stop stop-color="${accent}"/><stop offset="0.55" stop-color="${second}"/><stop offset="1" stop-color="${base}"/></radialGradient>
<radialGradient id="vig"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient>
</defs>
<rect width="${width}" height="${height}" fill="url(#bg)"/>
${inner}
<rect width="${width}" height="${height}" fill="url(#vig)"/>
</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function coverFor(game, variant = 'cover') {
  const width = variant === 'wide' ? 960 : 640
  const height = variant === 'wide' ? 540 : 400
  const seed = hashSeed(`${game.id}-${variant}`)
  const random = randomFrom(seed)
  const renderer = artRenderers[game.art] ?? geometricArt
  const inner = renderer(width, height, random, game.accent, game.palette[1])
  return wrapSvg(width, height, game.palette, game.accent, inner)
}

export function screenshotFor(game, index = 0) {
  return coverFor(game, `shot-${index}`)
}
