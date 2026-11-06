import { useEffect, useRef } from 'react'

type Point = { x: number; y: number; light: number; radius: number }
type Crop = { x: number; y: number; width: number; height: number }
const frontCrop: Crop = { x: 0.2, y: 0.012, width: 0.62, height: 0.62 }
const sideCrop: Crop = { x: 0.41, y: 0.25, width: 0.18, height: 0.12 }
const cursorCanvasSize = 300
const cursorCenter = cursorCanvasSize / 2
const spawnDuration = 1550
const clamp = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (value: number) => {
  const t = clamp(value)
  return t * t * (3 - 2 * t)
}

function samplePortrait(image: HTMLImageElement, crop: Crop): Point[] {
  if (!image.naturalWidth || !image.naturalHeight) return []
  const width = 72
  const height = 76
  const surface = document.createElement('canvas')
  surface.width = width
  surface.height = height
  const context = surface.getContext('2d', { willReadFrequently: true })
  if (!context) return []
  context.clearRect(0, 0, width, height)
  context.drawImage(
    image,
    crop.x * image.naturalWidth,
    crop.y * image.naturalHeight,
    crop.width * image.naturalWidth,
    crop.height * image.naturalHeight,
    0,
    0,
    width,
    height,
  )
  const pixels = context.getImageData(0, 0, width, height).data
  const points: Point[] = []
  const scale = Math.min(92 / width, 92 / height)
  const offsetX = (cursorCanvasSize - width * scale) / 2
  const offsetY = (cursorCanvasSize - height * scale) / 2
  const luminance = (i: number) => (pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722) / 255
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const i = (y * width + x) * 4
      const edge = Math.hypot(luminance(i + 4) - luminance(i - 4), luminance(i + width * 4) - luminance(i - width * 4))
      const tone = luminance(i)
      const silhouetteWidth = crop === sideCrop ? 0.62 : 0.49
      const oval = ((x - width * 0.5) / (width * silhouetteWidth)) ** 2 + ((y - height * 0.5) / (height * 0.52)) ** 2
      if (oval > 1 || (edge < 0.07 && tone > 0.82)) continue
      if (edge < 0.08 && tone > 0.68 && (x + y) % 3 === 0) continue
      points.push({
        x: offsetX + x * scale,
        y: offsetY + y * scale,
        light: Math.round(176 + Math.min(1, edge * 3.8) * 70),
        radius: 0.62 + Math.min(1, edge * 3) * 0.42,
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
    side.src = '/images/sidepose.png'
    const portraits = { front: [] as Point[], side: [] as Point[] }
    const startX = innerWidth / 2
    const startY = innerHeight / 2
    const motion = { x: startX, y: startY, targetX: startX, targetY: startY, facing: 0, targetFacing: 0 }
    const state = { visible: true, pointerSeen: false, overControl: false, ready: false, spawnStarted: performance.now() }
    const animationFrame = { id: 0 }
    const updateCursorMode = () => {
      document.body.classList.toggle('has-identity-cursor', state.pointerSeen && state.visible && state.ready && !state.overControl)
    }
    const prepare = () => {
      portraits.front = samplePortrait(front, frontCrop)
      portraits.side = samplePortrait(side, sideCrop)
      state.ready = portraits.front.length > 0 || portraits.side.length > 0
      updateCursorMode()
      draw()
      if (performance.now() - state.spawnStarted < spawnDuration) {
        cancelAnimationFrame(animationFrame.id)
        animationFrame.id = requestAnimationFrame(animate)
      }
    }
    const update = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      state.pointerSeen = true
      motion.targetX = Math.max(cursorCenter, Math.min(innerWidth - cursorCenter, event.clientX))
      motion.targetY = Math.max(cursorCenter, Math.min(innerHeight - cursorCenter, event.clientY))
      motion.targetFacing = event.clientX < innerWidth * 0.48 ? 1 : 0
      state.visible = true
      const target = document.elementFromPoint(event.clientX, event.clientY)
      state.overControl = Boolean(target?.closest('a,button,input,textarea,select,[role="button"]'))
      updateCursorMode()
      cancelAnimationFrame(animationFrame.id)
      animationFrame.id = requestAnimationFrame(animate)
    }
    const animate = (now: number) => {
      motion.x += (motion.targetX - motion.x) * 0.2
      motion.y += (motion.targetY - motion.y) * 0.2
      motion.facing += (motion.targetFacing - motion.facing) * 0.12
      draw(now)
      const spawning = state.spawnStarted !== null && now - state.spawnStarted < spawnDuration
      if (spawning || Math.abs(motion.x - motion.targetX) > 0.5 || Math.abs(motion.y - motion.targetY) > 0.5 || Math.abs(motion.facing - motion.targetFacing) > 0.01) {
        animationFrame.id = requestAnimationFrame(animate)
      }
    }
    function draw(now = performance.now()) {
      cursorCanvas.style.transform = 'translate3d(' + (motion.x - cursorCenter) + 'px,' + (motion.y - cursorCenter) + 'px,0)'
      cursorCanvas.style.opacity = state.visible && state.ready && !state.overControl ? '1' : '0'
      ctx.clearRect(0, 0, cursorCanvasSize, cursorCanvasSize)
      if (!state.visible || state.overControl || !state.ready) return
      const elapsed = state.spawnStarted === null ? spawnDuration : now - state.spawnStarted
      const forming = smooth((elapsed / spawnDuration - 0.68) / 0.32)
      const echoes = 1 - smooth((elapsed / spawnDuration - 0.52) / 0.4)
      const stage = clamp(elapsed / spawnDuration)
      const copies = stage >= 0.62 ? 8 : Math.min(8, 2 ** Math.floor(elapsed / 185))
      const orbit = Math.sin(stage * Math.PI) * 104
      const echoScale = 0.9 - smooth((stage - 0.52) / 0.42) * 0.78
      const drawPoints = (points: Point[], opacity: number, stride = 1, scale = 1, dx = 0, dy = 0) => {
        if (!points.length || opacity < 0.02) return
        ctx.globalAlpha = opacity
        for (let index = 0; index < points.length; index += stride) {
          const point = points[index]
          ctx.beginPath()
          ctx.fillStyle = 'rgb(' + point.light + ',' + point.light + ',' + Math.min(255, point.light + 4) + ')'
          ctx.arc(cursorCenter + (point.x - cursorCenter) * scale + dx, cursorCenter + (point.y - cursorCenter) * scale + dy, Math.max(0.35, point.radius * scale), 0, Math.PI * 2)
          ctx.fill()
        }
      }
      const drawPointerGlyph = (x: number, y: number, scale: number, opacity: number) => {
        if (opacity < 0.02) return
        ctx.save()
        ctx.globalAlpha = opacity
        ctx.translate(x, y)
        ctx.scale(scale, scale)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(0, 22)
        ctx.lineTo(5, 16)
        ctx.lineTo(10, 24)
        ctx.lineTo(13, 22)
        ctx.lineTo(8, 14)
        ctx.lineTo(16, 14)
        ctx.closePath()
        ctx.fillStyle = '#f4f0e7'
        ctx.fill()
        ctx.strokeStyle = 'rgba(8,9,11,.9)'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()
      }
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      if (echoes > 0.02) {
        for (let copy = 0; copy < copies; copy += 1) {
          const angle = (copy / copies) * Math.PI * 2 + stage * 0.8
          const distance = orbit * (0.76 + (copy % 3) * 0.12)
          const offsetX = Math.cos(angle) * distance
          const offsetY = Math.sin(angle) * distance
          drawPointerGlyph(cursorCenter + offsetX, cursorCenter + offsetY, echoScale, echoes * 0.9)
          const dust = smooth((stage - 0.38) / 0.35) * echoes * 0.72
          for (let speck = 0; speck < 10; speck += 1) {
            const seed = copy * 29 + speck * 17
            const driftX = Math.sin(seed * 12.9898) * (4 + stage * 11)
            const driftY = Math.cos(seed * 7.233) * (4 + stage * 11)
            ctx.globalAlpha = dust
            ctx.fillStyle = '#e5e8ea'
            ctx.beginPath()
            ctx.arc(cursorCenter + offsetX + driftX, cursorCenter + offsetY + driftY, 0.45 + (speck % 3) * 0.14, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
      drawPoints(portraits.front.length ? portraits.front : portraits.side, (1 - motion.facing) * forming)
      drawPoints(portraits.side.length ? portraits.side : portraits.front, motion.facing * forming)
      ctx.restore()
      ctx.globalAlpha = 1
    }
    const restartSequence = () => {
      state.spawnStarted = performance.now()
      cancelAnimationFrame(animationFrame.id)
      animationFrame.id = requestAnimationFrame(animate)
    }
    const leave = () => {
      state.visible = false
      updateCursorMode()
      draw()
    }
    front.addEventListener('load', prepare)
    side.addEventListener('load', prepare)
    front.addEventListener('error', prepare)
    side.addEventListener('error', prepare)
    window.addEventListener('pointermove', update, { passive: true })
    window.addEventListener('blur', leave)
    window.addEventListener('portfolio:intro-replay', restartSequence)
    return () => {
      cancelAnimationFrame(animationFrame.id)
      document.body.classList.remove('has-identity-cursor')
      window.removeEventListener('pointermove', update)
      window.removeEventListener('blur', leave)
      window.removeEventListener('portfolio:intro-replay', restartSequence)
      front.removeEventListener('load', prepare)
      side.removeEventListener('load', prepare)
      front.removeEventListener('error', prepare)
      side.removeEventListener('error', prepare)
    }
  }, [])
  return <canvas ref={canvasRef} className="identity-cursor" width={cursorCanvasSize} height={cursorCanvasSize} aria-hidden="true" />
}
