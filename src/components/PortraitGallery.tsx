import { useRef, useState, type PointerEvent, type KeyboardEvent } from 'react'
import portraitData from '../../content/portrait-gallery.json'

type Portrait = { src: string; alt: string; objectPosition: string }
const portraits = portraitData.items as Portrait[]

export function PortraitGallery() {
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState<number[]>([])
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const portrait = portraits[index]
  const imageFailed = failed.includes(index)

  const move = (delta: number) => setIndex((current) => (current + delta + portraits.length) % portraits.length)
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
  }
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') swipe.current = { x: event.clientX, y: event.clientY }
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!swipe.current || event.pointerType !== 'touch') return
    const deltaX = event.clientX - swipe.current.x
    const deltaY = event.clientY - swipe.current.y
    if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) move(deltaX < 0 ? 1 : -1)
    swipe.current = null
  }

  if (!portrait) return null
  return <section className="portrait-gallery" role="region" aria-roledescription="carousel" aria-label="Portrait gallery" tabIndex={0} onKeyDown={onKeyDown}>
    <div className="portrait-gallery-frame" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { swipe.current = null }}>
      {imageFailed
        ? <div className="portrait-gallery-fallback" role="status">This portrait is unavailable. Use the gallery controls to view another image.</div>
        : <img key={portrait.src} src={portrait.src} alt={portrait.alt} style={{ objectPosition: portrait.objectPosition }} onError={() => setFailed((items) => items.includes(index) ? items : [...items, index])} />}
      <button className="portrait-gallery-control portrait-gallery-control--previous" type="button" onClick={() => move(-1)} aria-label="Previous portrait">‹</button>
      <button className="portrait-gallery-control portrait-gallery-control--next" type="button" onClick={() => move(1)} aria-label="Next portrait">›</button>
      <span className="portrait-gallery-count" aria-live="polite">{String(index + 1).padStart(2, '0')} / {String(portraits.length).padStart(2, '0')}</span>
    </div>
    <div className="portrait-gallery-dots" aria-label="Choose a portrait">
      {portraits.map((item, dot) => <button type="button" key={item.src} className={dot === index ? 'is-active' : ''} aria-label={'Show portrait ' + (dot + 1)} aria-current={dot === index ? 'true' : undefined} onClick={() => setIndex(dot)} />)}
    </div>
    <p className="portrait-gallery-help">Use the arrows, keyboard, or swipe to browse.</p>
  </section>
}
