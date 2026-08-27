import type { CSSProperties } from 'react'

export function lampSeed(): number { return Math.floor(Math.random() * 1_000_000) }
export function lampStyle(seed: number) { const n = (seed % 997) / 997; return { '--lamp-x': `${20 + n * 60}%`, '--lamp-y': `${28 + ((seed * 7) % 40)}%`, '--lamp-hue': `${35 + n * 18}deg`, '--lamp-breath': `${3.6 + n * 1.8}s` } as CSSProperties }
