import { useEffect, useRef, useState } from 'react'
import { cardText, renderCard } from './lib/card'
import { lampSeed, lampStyle } from './lib/lamp'
import { clearStore, id, loadStore, saveDraft, saveLamp, type Lamp } from './lib/storage'

type View = 'home' | 'compose' | 'hold' | 'release' | 'lit' | 'card'
const HOLD_MS = 3000
const RELEASE_FALLBACK_MS = 11000

export default function App() {
  const [view, setView] = useState<View>('home')
  const [label, setLabel] = useState('')
  const [message, setMessage] = useState('')
  const [lamp, setLamp] = useState<Lamp | null>(null)
  const [progress, setProgress] = useState(0)
  const [notice, setNotice] = useState('')
  const [info, setInfo] = useState(false)
  const [card, setCard] = useState('')
  const [includeLabel, setIncludeLabel] = useState(false)
  const [includeMessage, setIncludeMessage] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const raf = useRef<number | undefined>(undefined)
  const started = useRef(0)
  const holding = useRef(false)
  const releaseTimer = useRef<number | undefined>(undefined)
  const ascentDone = useRef(false)
  const releaseSkip = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const draft = loadStore().draft
    if (draft) { setLabel(draft.label); setMessage(draft.message) }
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const cancel = () => { if (holding.current) stopHold() }
    window.addEventListener('blur', cancel)
    document.addEventListener('visibilitychange', cancel)
    return () => {
      window.removeEventListener('blur', cancel)
      document.removeEventListener('visibilitychange', cancel)
      if (raf.current !== undefined) cancelAnimationFrame(raf.current)
    }
  })

  useEffect(() => {
    if (view !== 'release') return
    if (reducedMotion) { completeAscent(); return }
    ascentDone.current = false
    releaseTimer.current = window.setTimeout(completeAscent, RELEASE_FALLBACK_MS)
    releaseSkip.current?.focus()
    return () => {
      if (releaseTimer.current !== undefined) window.clearTimeout(releaseTimer.current)
      releaseTimer.current = undefined
    }
  }, [view, reducedMotion])

  function begin() { setCard(''); setView('compose'); setNotice('') }
  function startHold() {
    if (view !== 'hold' || holding.current) return
    holding.current = true
    started.current = performance.now()
    setNotice('正在点亮。还需约 3 秒')
    const tick = (now: number) => {
      if (!holding.current) return
      const nextProgress = Math.min(1, (now - started.current) / HOLD_MS)
      setProgress(nextProgress)
      if (nextProgress >= 1) finish()
      else raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }
  function stopHold() {
    if (!holding.current) return
    holding.current = false
    if (raf.current !== undefined) cancelAnimationFrame(raf.current)
    raf.current = undefined
    setProgress(0)
    setView('compose')
    setNotice('它还在等你。')
  }
  function finish() {
    holding.current = false
    if (raf.current !== undefined) cancelAnimationFrame(raf.current)
    raf.current = undefined
    const next: Lamp = { id: id(), label, message, seed: lampSeed(), completedAt: new Date().toISOString() }
    saveLamp(next)
    setLamp(next)
    setProgress(1)
    setView(reducedMotion ? 'lit' : 'release')
    setNotice(reducedMotion ? '已经亮了。' : '灯正在升起。把这句话交给夜色。')
  }
  function completeAscent() {
    if (ascentDone.current) return
    ascentDone.current = true
    if (releaseTimer.current !== undefined) window.clearTimeout(releaseTimer.current)
    releaseTimer.current = undefined
    setView('lit')
    setNotice('已经亮了。')
  }
  function handleAnimationEnd(event: React.AnimationEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && event.animationName === 'rise-to-sky') completeAscent()
  }
  function keyDown(event: React.KeyboardEvent) { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); startHold() } }
  function keyUp(event: React.KeyboardEvent) { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); stopHold() } }
  async function makeCard() {
    if (!lamp) return
    try { setCard(await renderCard(lamp, includeLabel, includeMessage)) }
    catch { setNotice('图片暂时无法生成，你可以复制下面的文字。'); setCard('') }
    setView('card')
  }
  function reset() { clearStore(); setLamp(null); setLabel(''); setMessage(''); setView('home'); setNotice('当前设备的数据已清除，且不可恢复。') }
  const style = lamp ? lampStyle(lamp.seed) : undefined
  const scene = view === 'hold' || view === 'release' || view === 'lit'

  return <main className="app-shell">
    <div className="ambient" aria-hidden="true" />
    <header><span className="brand">照见</span><button className="text-button" onClick={() => setInfo(true)}>作品说明</button></header>
    {view === 'home' && <section className="hero"><p className="eyebrow">中元夜 · 私密纪念作品</p><h1>为想念的人<br /><em>留一盏灯</em></h1><p className="lede">有些人离开很久了。<br />却仍在我们生活的细节里。</p><button className="primary" onClick={begin}>留一盏灯 <span>→</span></button><button className="secondary" onClick={() => setInfo(true)}>先在这里看看</button></section>}
    {view === 'compose' && <section className="panel"><p className="eyebrow">写下，或不写</p><h2>让这一刻有一个<br />只有你知道的称呼。</h2><label>此刻，你想起了谁？<input maxLength={24} value={label} onChange={event => { setLabel(event.target.value); saveDraft(event.target.value, message) }} placeholder="一个只有你知道的称呼" /></label><label>如果只能留一句话，你想对 Ta 说什么？<textarea maxLength={120} rows={3} value={message} onChange={event => { setMessage(event.target.value); saveDraft(label, event.target.value) }} placeholder="最近的日子，我过得还不错。" /></label><p className="privacy">这句话只保存在当前设备。称呼和留言都可以留空。</p><button className="primary" onClick={() => setView('hold')}>下一步 <span>→</span></button><button className="secondary" onClick={() => setView('home')}>返回</button></section>}
    {scene && <section className="scene" style={style}><div className="stars" aria-hidden="true" /><div className={`lamp ${view === 'release' ? 'releasing' : view === 'lit' ? 'lit' : ''}`} onAnimationEnd={handleAnimationEnd} aria-hidden="true" /><div className="scene-copy" aria-live="polite"><p className="eyebrow">{view === 'hold' ? '点灯' : view === 'release' ? '升灯' : '你的灯'}</p><h2>{notice}</h2>{view === 'hold' && <p>请轻轻按住它，让这句话在今晚亮起来。</p>}{view === 'release' && <p>让它慢慢升入夜色。你也可以现在留在灯下。</p>}{view === 'lit' && <p>有些话不必抵达。<br />被想起，便有了归处。</p>}</div>{view === 'hold' && <button className="hold-button" onPointerDown={startHold} onPointerUp={stopHold} onPointerCancel={stopHold} onKeyDown={keyDown} onKeyUp={keyUp} aria-label="持续按住三秒点灯">按住这里<br /><strong>{Math.round(progress * 100)}%</strong></button>}{view === 'release' && <button ref={releaseSkip} className="release-skip secondary" onClick={completeAscent}>跳过升灯</button>}{view === 'lit' && <div className="actions"><button className="primary" onClick={makeCard}>带走这束光 <span>→</span></button><button className="secondary" onClick={begin}>再留一盏</button></div>}</section>}
    {view === 'card' && <section className="panel card-panel"><p className="eyebrow">带走这束光</p><h2>这张卡，默认不带走你的话。</h2><div className="checks"><label><input type="checkbox" checked={includeLabel} onChange={event => setIncludeLabel(event.target.checked)} /> 添加称呼</label><label><input type="checkbox" checked={includeMessage} onChange={event => setIncludeMessage(event.target.checked)} /> 添加留言</label></div>{card ? <img className="card-image" src={card} alt="纪念卡预览" /> : <pre>{lamp && cardText(lamp, includeLabel, includeMessage)}</pre>}<button className="primary" onClick={() => card && Object.assign(document.createElement('a'), { href: card, download: 'zhaojian-card.png' }).click()}>保存纪念卡</button><button className="secondary" onClick={() => setView('lit')}>返回灯下</button></section>}
    <footer><button className="text-button" onClick={() => setInfo(true)}>隐私说明</button><button className="text-button" onClick={reset}>清除本地数据</button></footer>
    {info && <div className="modal-backdrop" onClick={() => setInfo(false)}><aside className="modal" onClick={event => event.stopPropagation()}><button className="close" onClick={() => setInfo(false)}>×</button><p className="eyebrow">关于《照见》</p><h2>一盏灯，也足以照见一个人。</h2><p>这是一次短暂、私密的网络纪念仪式。私密灯只保存在当前设备，环境光不代表其他用户。这里不提供通灵、祈福结果或任何人的回应。</p><p>我们不要求真实姓名，也不收集身份、位置或设备指纹。清除浏览器数据后，私密内容无法恢复。</p></aside></div>}
  </main>
}
