import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { CinematicRenderer, type IntroProgress } from '../animation/cinematicRenderer'
import { PortfolioExperience } from './PortfolioExperience'

export function CinematicIntro() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<CinematicRenderer | null>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const skipRequestedRef = useRef(false)
  const [reducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [introComplete, setIntroComplete] = useState(false)
  const progress = useRef<IntroProgress>({ breach: 0, identity: 0, collapse: 0 })
  const zoom = useRef({ value: 0 })
  const aliveRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    aliveRef.current = true
    const portrait = new Image()
    portrait.decoding = 'async'
    portrait.src = '/images/face.png'
    const start = () => {
      if (!aliveRef.current || !portrait.naturalWidth) return
      const renderer = new CinematicRenderer(canvas, portrait, progress.current, zoom.current)
      rendererRef.current = renderer
      if (reducedMotion || skipRequestedRef.current) {
        Object.assign(progress.current, { breach: 1, identity: 1, collapse: 1 })
        zoom.current.value = reducedMotion ? 0 : 1
        setIntroComplete(true)
        renderer.invalidate()
        return
      }
      const timeline = gsap.timeline({ onComplete: () => setIntroComplete(true) })
      timeline
        .to({}, { duration: 0.8 })
        .fromTo(progress.current, { breach: 0 }, { breach: 1, duration: 4, ease: 'power2.inOut', onUpdate: renderer.invalidate })
        .fromTo(progress.current, { identity: 0 }, { identity: 1, duration: 3, ease: 'power2.inOut', onUpdate: renderer.invalidate })
        .fromTo(progress.current, { collapse: 0 }, { collapse: 1, duration: 4, ease: 'power2.inOut', onUpdate: renderer.invalidate })
        .to({}, { duration: 1.6 })
        .to(zoom.current, { value: 1, duration: 1.8, ease: 'power2.in', onUpdate: renderer.invalidate })
      timelineRef.current = timeline
    }
    portrait.addEventListener('load', start, { once: true })
    if (portrait.complete && portrait.naturalWidth) start()
    portrait.addEventListener('error', () => setIntroComplete(true), { once: true })
    return () => {
      aliveRef.current = false
      portrait.removeEventListener('load', start)
      timelineRef.current?.kill()
      rendererRef.current?.destroy()
      timelineRef.current = null
      rendererRef.current = null
    }
  }, [reducedMotion])

  const replayIntro = useCallback(() => {
    skipRequestedRef.current = false
    if (reducedMotion) {
      Object.assign(progress.current, { breach: 1, identity: 1, collapse: 1 })
      zoom.current.value = 0
      setIntroComplete(true)
      rendererRef.current?.invalidate()
    } else {
      Object.assign(progress.current, { breach: 0, identity: 0, collapse: 0 })
      zoom.current.value = 0
      setIntroComplete(false)
      timelineRef.current?.restart()
      rendererRef.current?.invalidate()
    }
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [reducedMotion])

  const skipIntro = useCallback(() => {
    if (introComplete) return
    skipRequestedRef.current = true
    Object.assign(progress.current, { breach: 1, identity: 1, collapse: 1 })
    zoom.current.value = reducedMotion ? 0 : 1
    if (timelineRef.current && !reducedMotion) timelineRef.current.progress(1)
    else {
      setIntroComplete(true)
      rendererRef.current?.invalidate()
    }
  }, [introComplete, reducedMotion])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable)) return
      if (event.key === 'Escape' && !introComplete) skipIntro()
      else if (event.key.toLowerCase() === 'r') replayIntro()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [introComplete, replayIntro, skipIntro])

  return (
    <main id="top">
      <section className="cinematic-runway" aria-label="Facial identity scan introduction">
        <div className="cinematic-screen">
          <canvas ref={canvasRef} className="cinematic-canvas" aria-hidden="true" />
          {!introComplete && !reducedMotion && <button className="intro-skip" type="button" onClick={skipIntro}>SKIP INTRO <span aria-hidden="true">↗</span></button>}
        </div>
      </section>
      <PortfolioExperience onReplay={replayIntro} />
    </main>
  )
}
