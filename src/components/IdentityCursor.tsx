import { useEffect, useRef } from 'react'

type Point = { x: number; y: number; light: number; radius: number }
type Crop = { x: number; y: number; width: number; height: number }
const frontCrop: Crop = { x: 0.2, y: 0.012, width: 0.62, height: 0.62 }
const sideCrop: Crop = { x: 0.36, y: 0.235, width: 0.24, height: 0.135 }

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
  const scale = Math.min(96 / width, 96 / height)
  const offsetX = (120 - width * scale) / 2
  const offsetY = (120 - height * scale) / 2
  const luminance = (i: number) => (pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722) / 255
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const i = (y * width + x) * 4
      const edge = Math.hypot(luminance(i + 4) - luminance(i - 4), luminance(i + width * 4) - luminance(i - width * 4))
      const tone = luminance(i)
      const oval = ((x - width * 0.5) / (width * 0.49)) ** 2 + ((y - height * 0.5) / (height * 0.52)) ** 2
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
    const motion = { x: -200, y: -200, targetX: -200, targetY: -200, facing: 0, targetFacing: 0 }
    const state = { visible: false, overControl: false, ready: false }
    const animationFrame = { id: 0 }
    const updateCursorMode = () => {
      document.body.classList.toggle('has-identity-cursor', state.visible && state.ready && !state.overControl)
    }
    const prepare = () => {
      portraits.front = samplePortrait(front, frontCrop)
      portraits.side = samplePortrait(side, sideCrop)
      state.ready = portraits.front.length > 0 || portraits.side.length > 0
      updateCursorMode()
      draw()
    }
    const update = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      motion.targetX = Math.max(60, Math.min(innerWidth - 60, event.clientX))
      motion.targetY = Math.max(60, Math.min(innerHeight - 60, event.clientY))
      motion.targetFacing = event.clientX < innerWidth * 0.48 ? 1 : 0
      state.visible = true
      const target = document.elementFromPoint(event.clientX, event.clientY)
      state.overControl = Boolean(target?.closest('a,button,input,textarea,select,[role="button"]'))
      updateCursorMode()
      cancelAnimationFrame(animationFrame.id)
      animationFrame.id = requestAnimationFrame(animate)
    }
    const animate = () => {
      motion.x += (motion.targetX - motion.x) * 0.2
      motion.y += (motion.targetY - motion.y) * 0.2
      motion.facing += (motion.targetFacing - motion.facing) * 0.12
      draw()
      if (Math.abs(motion.x - motion.targetX) > 0.5 || Math.abs(motion.y - motion.targetY) > 0.5 || Math.abs(motion.facing - motion.targetFacing) > 0.01) {
        animationFrame.id = requestAnimationFrame(animate)
      }
    }
    function draw() {
      cursorCanvas.style.transform = 'translate3d(' + (motion.x - 60) + 'px,' + (motion.y - 60) + 'px,0)'
      cursorCanvas.style.opacity = state.visible && state.ready && !state.overControl ? '1' : '0'
      ctx.clearRect(0, 0, 120, 120)
      if (!state.visible || state.overControl || !state.ready) return
      const drawPoints = (points: Point[], opacity: number) => {
        if (!points.length || opacity < 0.02) return
        ctx.globalAlpha = opacity
        for (const point of points) {
          ctx.beginPath()
          ctx.fillStyle = 'rgb(' + point.light + ',' + point.light + ',' + Math.min(255, point.light + 4) + ')'
          ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      drawPoints(portraits.front.length ? portraits.front : portraits.side, 1 - motion.facing)
      drawPoints(portraits.side.length ? portraits.side : portraits.front, motion.facing)
      ctx.restore()
      ctx.globalAlpha = 1
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
    return () => {
      cancelAnimationFrame(animationFrame.id)
      document.body.classList.remove('has-identity-cursor')
      window.removeEventListener('pointermove', update)
      window.removeEventListener('blur', leave)
      front.removeEventListener('load', prepare)
      side.removeEventListener('load', prepare)
      front.removeEventListener('error', prepare)
      side.removeEventListener('error', prepare)
    }
  }, [])
  return <canvas ref={canvasRef} className="identity-cursor" width={120} height={120} aria-hidden="true" />
}
