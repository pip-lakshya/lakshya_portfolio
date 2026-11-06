import { useEffect, useRef } from 'react'

type Crop = { x: number; y: number; width: number; height: number }
type Dot = { x: number; y: number; light: number; radius: number }
const frontCrop: Crop = { x: 0.18, y: 0.005, width: 0.64, height: 0.65 }
const sideCrop: Crop = { x: 0.36, y: 0, width: 0.31, height: 0.2 }
const cursorCanvasSize = 300
const cursorCenter = cursorCanvasSize / 2
const faceHeight = 56
const clamp = (value: number) => Math.max(0, Math.min(1, value))

function samplePortrait(image: HTMLImageElement, crop: Crop): Dot[] {
  if (!image.naturalWidth || !image.naturalHeight) return []
  const width = 96
  const height = 112
  const cropWidth = crop.width * image.naturalWidth
  const cropHeight = crop.height * image.naturalHeight
  const scale = Math.min(width / cropWidth, height / cropHeight)
  const drawWidth = cropWidth * scale
  const drawHeight = cropHeight * scale
  const offsetX = (width - drawWidth) / 2
  const offsetY = (height - drawHeight) / 2
  const faceWidth = Math.min(48, faceHeight * cropWidth / cropHeight)
  const sample = document.createElement('canvas')
  sample.width = width
  sample.height = height
  const context = sample.getContext('2d', { willReadFrequently: true })
  if (!context) return []
  context.drawImage(image, crop.x * image.naturalWidth, crop.y * image.naturalHeight, cropWidth, cropHeight, offsetX, offsetY, drawWidth, drawHeight)
  const pixels = context.getImageData(0, 0, width, height).data
  const tone = (index: number) => (pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722) / 255
  const points: Dot[] = []

  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 2) {
      const nx = (x - offsetX) / drawWidth
      const ny = (y - offsetY) / drawHeight
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) continue
      const oval = ((nx - 0.5) / 0.48) ** 2 + ((ny - 0.5) / 0.52) ** 2
      const index = (y * width + x) * 4
      if (oval > 1 || pixels[index + 3] < 80) continue
      const center = tone(index)
      const edge = Math.min(1, Math.hypot(tone(index + 4) - tone(index - 4), tone(index + width * 4) - tone(index - width * 4)) * 3.5)
      points.push({
        x: (nx - 0.5) * faceWidth,
        y: (ny - 0.5) * faceHeight,
        light: Math.round(112 + center * 112 + edge * 24),
        radius: 0.38 + edge * 0.48,
      })
    }
  }
  return points
}

export function IdentityCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const cursorCanvas = canvas
    const context = cursorCanvas.getContext('2d')
    if (!context) return
    const ctx = context
    const front = new Image()
    const side = new Image()
    front.src = '/images/face.png'
    side.src = '/images/sidepose-cutout.png'
    const portraits = { front: [] as Dot[], side: [] as Dot[] }
    const motion = { x: innerWidth / 2, y: innerHeight / 2, targetX: innerWidth / 2, targetY: innerHeight / 2, facing: 0, targetFacing: 0 }
    const state = { released: false, visible: false, overControl: false, ready: false }
    const frame = { id: 0 }

    const updateCursorMode = () => {
      document.body.classList.toggle('has-identity-cursor', state.released && state.visible && state.ready && !state.overControl)
    }
    const prepare = () => {
      portraits.front = samplePortrait(front, frontCrop)
      portraits.side = samplePortrait(side, sideCrop)
      state.ready = portraits.front.length > 0 || portraits.side.length > 0
      draw()
    }
    const animate = () => {
      motion.x += (motion.targetX - motion.x) * 0.25
      motion.y += (motion.targetY - motion.y) * 0.25
      motion.facing += (motion.targetFacing - motion.facing) * 0.16
      draw()
      if (Math.abs(motion.x - motion.targetX) > 0.5 || Math.abs(motion.y - motion.targetY) > 0.5 || Math.abs(motion.facing - motion.targetFacing) > 0.01) {
        frame.id = requestAnimationFrame(animate)
      }
    }
    const update = (event: PointerEvent) => {
      if (!state.released || event.pointerType === 'touch') return
      motion.targetX = Math.max(cursorCenter, Math.min(innerWidth - cursorCenter, event.clientX))
      motion.targetY = Math.max(cursorCenter, Math.min(innerHeight - cursorCenter, event.clientY))
      motion.targetFacing = event.clientX < innerWidth * 0.48 ? 1 : 0
      state.visible = true
      const target = document.elementFromPoint(event.clientX, event.clientY)
      state.overControl = Boolean(target?.closest('a,button,input,textarea,select,[role="button"]'))
      updateCursorMode()
      cancelAnimationFrame(frame.id)
      frame.id = requestAnimationFrame(animate)
    }
    const release = () => {
      state.released = true
      state.visible = false
      updateCursorMode()
      draw()
    }
    const replay = () => {
      state.released = false
      state.visible = false
      updateCursorMode()
      draw()
    }
    const leave = () => {
      state.visible = false
      updateCursorMode()
      draw()
    }
    function draw() {
      cursorCanvas.style.transform = 'translate3d(' + (motion.x - cursorCenter) + 'px,' + (motion.y - cursorCenter) + 'px,0)'
      cursorCanvas.style.opacity = state.released && state.visible && state.ready && !state.overControl ? '1' : '0'
      ctx.clearRect(0, 0, cursorCanvasSize, cursorCanvasSize)
      if (!state.released || !state.visible || !state.ready || state.overControl) return
      const drawDots = (points: Dot[], opacity: number) => {
        if (!points.length || opacity < 0.02) return
        ctx.globalAlpha = opacity
        for (const point of points) {
          ctx.beginPath()
          ctx.fillStyle = 'rgb(' + point.light + ',' + point.light + ',' + Math.min(255, point.light + 4) + ')'
          ctx.arc(cursorCenter + point.x, cursorCenter + point.y, point.radius, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      drawDots(portraits.front, 1 - clamp(motion.facing))
      drawDots(portraits.side, clamp(motion.facing))
      ctx.restore()
      ctx.globalAlpha = 1
    }

    front.addEventListener('load', prepare)
    side.addEventListener('load', prepare)
    front.addEventListener('error', prepare)
    side.addEventListener('error', prepare)
    window.addEventListener('pointermove', update, { passive: true })
    window.addEventListener('blur', leave)
    window.addEventListener('portfolio:intro-complete', release)
    window.addEventListener('portfolio:intro-replay', replay)
    return () => {
      cancelAnimationFrame(frame.id)
      document.body.classList.remove('has-identity-cursor')
      window.removeEventListener('pointermove', update)
      window.removeEventListener('blur', leave)
      window.removeEventListener('portfolio:intro-complete', release)
      window.removeEventListener('portfolio:intro-replay', replay)
      front.removeEventListener('load', prepare)
      side.removeEventListener('load', prepare)
      front.removeEventListener('error', prepare)
      side.removeEventListener('error', prepare)
    }
  }, [])
  return <canvas ref={canvasRef} className="identity-cursor" width={cursorCanvasSize} height={cursorCanvasSize} aria-hidden="true" />
}
