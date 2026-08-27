export type Lamp = { id: string; label: string; message: string; seed: number; completedAt: string }

const KEY = 'zhaojian-p0-v1'
type Store = { draft: { label: string; message: string } | null; lamps: Lamp[] }
const empty: Store = { draft: null, lamps: [] }

function read(): Store {
  try { return JSON.parse(localStorage.getItem(KEY) || '') as Store } catch { return empty }
}
export function loadStore(): Store { return read() }
export function saveDraft(label: string, message: string) { try { localStorage.setItem(KEY, JSON.stringify({ ...read(), draft: { label, message } })) } catch {} }
export function saveLamp(lamp: Lamp) { try { const store = read(); localStorage.setItem(KEY, JSON.stringify({ draft: null, lamps: [...store.lamps, lamp] })) } catch {} }
export function clearStore() { try { localStorage.removeItem(KEY) } catch {} }
export function id() { return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}` }
