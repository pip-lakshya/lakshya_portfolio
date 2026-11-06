import { useEffect, useRef } from 'react'

type Point = { x: number; y: number; light: number; radius: number }
type Crop = { x: number; y: number; width: number; height: number }
const frontCrop: Crop = { x: .23, y: .015, width: .58, height: .66 }
const sideCrop: Crop = { x: .38, y: .21, width: .25, height: .22 }

function samplePortrait(image: HTMLImageElement, crop: Crop): Point[] {
  const width = 64
  const height = Math.round(width * (crop.height * image.naturalHeight) / (crop.width * image.naturalWidth))
  const surface = document.createElement('canvas')
  surface.width = width
  surface.height = height
  const context = surface.getContext('2d', { willReadFrequently: true })
  if (!context) return []
  context.drawImage(image, crop.x * image.naturalWidth, crop.y * image.naturalHeight, crop.width * image.naturalWidth, crop.height * image.naturalHeight, 0, 0, width, height)
  const pixels = context.getImageData(0, 0, width, height).data
  const points: Point[] = []
  const scale = Math.min(92 / width, 92 / height)
  const ox = (120 - width * scale) / 2
  const oy = (120 - height * scale) / 2
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const i = (y * width + x) * 4
      const luma = (r: number, g: number, b: number) => (r * .2126 + g * .7152 + b * .0722) / 255
      const left = luma(pixels[i - 4], pixels[i - 3], pixels[i - 2])
      const right = luma(pixels[i + 4], pixels[i + 5], pixels[i + 6])
      const up = luma(pixels[i - width * 4], pixels[i - width * 4 + 1], pixels[i - width * 4 + 2])
      const down = luma(pixels[i + width * 4], pixels[i + width * 4 + 1], pixels[i + width * 4 + 2])
      const edge = Math.hypot(right - left, down - up)
      if (edge < .12 && luma(pixels[i], pixels[i + 1], pixels[i + 2]) > .35) continue
      if ((x * 17 + y * 31) % 4 === 0 && edge < .25) continue
      points.push({
        x: ox + x * scale,
        y: oy + y * scale,
        light: Math.round(165 + Math.min(1, edge * 3.4) * 80),
        radius: .55 + ((x * 7 + y * 13) % 5) * .11,
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
    const lifecycle = { alive: true }
    const front = new Image()
    const side = new Image()
    front.src = '/images/face.png'
    side.src = '/images/sidepose.png'
    const portraits = { front: [] as Point[], side: [] as Point[] }
    const motion = { x: -200, y: -200, targetX: -200, targetY: -200, facing: 0, targetFacing: 0 }
    const pointerState = { visible: false, hoveringControl: false }
    const animationFrame = { id: 0 }

    const prepare = () => {
      if (front.naturalWidth) portraits.front = samplePortrait(front, frontCrop)
      if (side.naturalWidth) portraits.side = samplePortrait(side, sideCrop)
      draw()
    }
    const update = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      motion.targetX = Math.max(0, Math.min(innerWidth - 120, event.clientX + 15))
      motion.targetY = Math.max(0, Math.min(innerHeight - 120, event.clientY + 15))
      motion.targetFacing = event.clientX < innerWidth * .48 ? 1 : 0
      pointerState.visible = true
      const target = document.elementFromPoint(event.clientX, event.clientY)
      pointerState.hoveringControl = Boolean(target?.closest('a,button,input,textarea,select,[role="button"]'))
      cancelAnimationFrame(animationFrame.id)
      animationFrame.id = requestAnimationFrame(animate)
    }
    const animate = () => {
      if (!lifecycle.alive) return
      motion.x += (motion.targetX - motion.x) * .22
      motion.y += (motion.targetY - motion.y) * .22
      motion.facing += (motion.targetFacing - motion.facing) * .12
      draw()
      if (Math.abs(motion.x - motion.targetX) > .5 || Math.abs(motion.y - motion.targetY) > .5 || Math.abs(motion.facing - motion.targetFacing) > .01) animationFrame.id = requestAnimationFrame(animate)
    }
    function draw() {
      cursorCanvas.style.transform = `translate3d(${motion.x}px, ${motion.y}px, 0)`
      cursorCanvas.style.opacity = pointerState.visible && !pointerState.hoveringControl ? '1' : '0'
      ctx.clearRect(0, 0, 120, 120)
      if (!pointerState.visible || pointerState.hoveringControl || (!portraits.front.length && !portraits.side.length)) return
      const drawPoints = (points: Point[], alpha: number) => {
        if (!points.length || alpha < .015) return
        ctx.globalAlpha = alpha
        for (const point of points) {
          ctx.beginPath()
          ctx.fillStyle = `rgb(${point.light},${point.light},${Math.min(255, point.light + 4)})`
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
    front.addEventListener('load', prepare)
    side.addEventListener('load', prepare)
    const leave = () => { pointerState.visible = false; draw() }
    window.addEventListener('pointermove', update, { passive: true })
    window.addEventListener('blur', leave)
    return () => {
      lifecycle.alive = false
      cancelAnimationFrame(animationFrame.id)
      window.removeEventListener('pointermove', update)
      window.removeEventListener('blur', leave)
      front.removeEventListener('load', prepare)
      side.removeEventListener('load', prepare)
    }
  }, [])
  return <canvas ref={canvasRef} className="identity-cursor" width={120} height={120} aria-hidden="true" />
}
