import { useCallback, useEffect, useRef, useState } from 'react'
import { CinematicRenderer, type IntroProgress } from '../animation/cinematicRenderer'
import { IdentityCursor } from './IdentityCursor'
import { PortfolioExperience } from './PortfolioExperience'

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const segment = (value: number, start: number, end: number) => clamp((value - start) / (end - start))
const jumpTo = (top: number) => window.scrollTo({ top, left: 0, behavior: 'instant' })

export function CinematicIntro() {
  const runwayRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<CinematicRenderer | null>(null)
  const progressFrameRef = useRef(0)
  const [coarsePointer] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches)
  const startPrompt = coarsePointer ? 'SCROLL TO BEGIN' : 'CURSOR SEQUENCE · THEN SCROLL TO BEGIN'
  const progress = useRef<IntroProgress>({ breach: 0, identity: 0, turn: 0, collapse: 0 })
  const [reducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [introComplete, setIntroComplete] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [introFailed, setIntroFailed] = useState(false)
  const [prompt, setPrompt] = useState(startPrompt)
  const aliveRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const runway = runwayRef.current
    if (!canvas || !runway || reducedMotion) return
    aliveRef.current = true
    const portrait = new Image()
    const sidePortrait = new Image()
    portrait.decoding = 'async'
    sidePortrait.decoding = 'async'
    portrait.src = '/images/face.png'
    sidePortrait.src = '/images/sidepose-cutout.png'
    const updateScrollProgress = () => {
      progressFrameRef.current = 0
      const distance = Math.max(1, runway.offsetHeight - window.innerHeight)
      const travelled = clamp(-runway.getBoundingClientRect().top / distance)
      progress.current.breach = segment(travelled, 0, 0.26)
      progress.current.identity = segment(travelled, 0.17, 0.48)
      progress.current.turn = segment(travelled, 0.44, 0.72)
      progress.current.collapse = segment(travelled, 0.70, 0.98)
      rendererRef.current?.invalidate()

      const nextPrompt = travelled < 0.16
        ? startPrompt
        : travelled < 0.46
          ? 'SCROLL TO FORM THE FACE'
          : travelled < 0.70
            ? 'SCROLL TO TURN'
            : travelled < 0.98
              ? 'SCROLL TO RELEASE'
              : 'ENTER THE PORTFOLIO'
      setPrompt((current) => current === nextPrompt ? current : nextPrompt)
      setIntroComplete(travelled >= 0.995)
    }
    const requestProgressUpdate = () => {
      if (!progressFrameRef.current) progressFrameRef.current = requestAnimationFrame(updateScrollProgress)
    }

    const start = () => {
      if (!aliveRef.current || !portrait.naturalWidth || rendererRef.current) return
      try {
        rendererRef.current = new CinematicRenderer(canvas, portrait, sidePortrait, progress.current, { value: 0 })
        requestProgressUpdate()
      } catch {
        setIntroFailed(true)
        setIntroComplete(true)
      }
    }
    const onPortraitError = () => {
      if (!aliveRef.current) return
      setIntroFailed(true)
      setIntroComplete(true)
    }

    portrait.addEventListener('load', start)
    portrait.addEventListener('error', onPortraitError)
    window.addEventListener('scroll', requestProgressUpdate, { passive: true })
    window.addEventListener('resize', requestProgressUpdate)
    if (portrait.complete && portrait.naturalWidth) start()

    return () => {
      aliveRef.current = false
      cancelAnimationFrame(progressFrameRef.current)
      progressFrameRef.current = 0
      portrait.removeEventListener('load', start)
      portrait.removeEventListener('error', onPortraitError)
      window.removeEventListener('scroll', requestProgressUpdate)
      window.removeEventListener('resize', requestProgressUpdate)
      rendererRef.current?.destroy()
      rendererRef.current = null
    }
  }, [reducedMotion, startPrompt])

  const replayIntro = useCallback(() => {
    if (introFailed || reducedMotion) {
      document.getElementById('home')?.scrollIntoView({ behavior: 'auto' })
      return
    }
    Object.assign(progress.current, { breach: 0, identity: 0, turn: 0, collapse: 0 })
    rendererRef.current?.reset()
    setPrompt(startPrompt)
    setIntroComplete(false)
    window.dispatchEvent(new Event('portfolio:intro-replay'))
    jumpTo(0)
  }, [introFailed, reducedMotion, startPrompt])

  const skipIntro = useCallback(() => {
    setIntroComplete(true)
    jumpTo(runwayRef.current?.offsetHeight ?? 0)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable)) return
      if (event.key === 'Escape' && !introComplete && !reducedMotion) skipIntro()
      else if (event.key.toLowerCase() === 'r') replayIntro()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [introComplete, reducedMotion, replayIntro, skipIntro])

  return (
    <main id="top">
      <IdentityCursor />
      <section
        ref={runwayRef}
        className={'cinematic-runway' + (reducedMotion ? ' cinematic-runway--reduced' : '') + (introFailed ? ' cinematic-runway--failed' : '')}
        aria-label="Scroll-controlled facial identity introduction"
      >
        <div className="cinematic-screen">
          <canvas ref={canvasRef} className="cinematic-canvas" aria-hidden="true" />
          {!introComplete && !reducedMotion && !introFailed && <button className="intro-skip" type="button" onClick={skipIntro}>SKIP INTRO <span aria-hidden="true">↗</span></button>}
          {!introComplete && !reducedMotion && !introFailed && <p className="intro-prompt" aria-live="polite">{prompt}</p>}
          {introFailed && <a className="intro-fallback" href="#home">INTRO UNAVAILABLE · CONTINUE TO PORTFOLIO <span aria-hidden="true">↘</span></a>}
        </div>
      </section>
      <PortfolioExperience onReplay={replayIntro} />
    </main>
  )
}
