import type { Lamp } from './storage'

export function cardText(lamp: Lamp, includeLabel = false, includeMessage = false) {
  const date = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(lamp.completedAt))
  return ['《照见》', '今晚，', '我为想念的人留了一盏灯。', includeLabel && lamp.label ? `—— ${lamp.label}` : '', includeMessage && lamp.message ? `“${lamp.message}”` : '', date, '', '愿所有想念，都有一处微光。'].filter(Boolean).join('\n')
}
export async function renderCard(lamp: Lamp, includeLabel: boolean, includeMessage: boolean) {
  const canvas = document.createElement('canvas'); canvas.width = 900; canvas.height = 1200
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('canvas-unavailable')
  const g = ctx.createLinearGradient(0, 0, 900, 1200); g.addColorStop(0, '#0d1113'); g.addColorStop(1, '#20252a'); ctx.fillStyle = g; ctx.fillRect(0, 0, 900, 1200)
  ctx.fillStyle = '#e0b45b'; ctx.beginPath(); ctx.arc(450, 360, 100, 0, Math.PI * 2); ctx.shadowBlur = 100; ctx.shadowColor = '#d9a441'; ctx.fill(); ctx.shadowBlur = 0
  ctx.fillStyle = '#f2efe7'; ctx.textAlign = 'center'; ctx.font = '34px serif'
  cardText(lamp, includeLabel, includeMessage).split('\n').forEach((line, i) => ctx.fillText(line, 450, 650 + i * 58))
  return canvas.toDataURL('image/png')
}
