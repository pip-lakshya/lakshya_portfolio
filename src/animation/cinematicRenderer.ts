export interface IntroProgress {
  breach: number
  identity: number
  turn: number
  collapse: number
}

type Crop = { x: number; y: number; width: number; height: number }
type Point = { x: number; y: number; z: number; shade: number; radius: number; phase: number }
type Cloud = { points: Point[]; width: number; height: number; cx: number; cy: number }

const frontCrop: Crop = { x: 0.18, y: 0.005, width: 0.64, height: 0.65 }
const profileCrop: Crop = { x: 0.36, y: 0, width: 0.31, height: 0.2 }
const clamp = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (value: number) => {
  const t = clamp(value)
  return t * t * (3 - 2 * t)
}
const random = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}
const luma = (data: Uint8ClampedArray, index: number) =>
  (data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722) / 255

export class CinematicRenderer {
  private readonly ctx: CanvasRenderingContext2D
  private readonly canvas: HTMLCanvasElement
  private readonly image: HTMLImageElement
  private readonly profileImage: HTMLImageElement
  private readonly progress: IntroProgress
  private readonly zoom: { value: number }
  private readonly observer: ResizeObserver
  private front: Cloud | null = null
  private profile: Cloud | null = null
  private width = 1
  private height = 1
  private dpr = 1
  private frame = 0
  private dead = false
  private startTime: number | null = null
  private clock = 0
  private readonly mobile = matchMedia('(max-width: 640px)').matches

  constructor(
    canvas: HTMLCanvasElement,
    image: HTMLImageElement,
    profileImage: HTMLImageElement,
    progress: IntroProgress,
    zoom: { value: number },
  ) {
    this.canvas = canvas
    this.image = image
    this.profileImage = profileImage
    this.progress = progress
    this.zoom = zoom
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Canvas 2D is unavailable')
    this.ctx = context
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    this.profileImage.addEventListener('load', this.onProfileLoad)
    this.profileImage.addEventListener('error', this.onProfileError)
    this.resize()
    this.invalidate()
  }

  invalidate = () => {
    if (this.dead || this.frame) return
    this.frame = requestAnimationFrame(this.tick)
  }

  reset = () => {
    this.startTime = null
    this.clock = 0
    this.invalidate()
  }

  destroy = () => {
    this.dead = true
    cancelAnimationFrame(this.frame)
    this.observer.disconnect()
    this.profileImage.removeEventListener('load', this.onProfileLoad)
    this.profileImage.removeEventListener('error', this.onProfileError)
  }

  private onProfileLoad = () => {
    this.profile = this.makeCloud(this.profileImage, profileCrop)
    this.invalidate()
  }

  private onProfileError = () => {
    this.profile = null
    this.invalidate()
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect()
    this.width = Math.max(1, rect.width)
    this.height = Math.max(1, rect.height)
    this.dpr = Math.min(devicePixelRatio || 1, this.mobile ? 1.25 : 1.6)
    this.canvas.width = Math.round(this.width * this.dpr)
    this.canvas.height = Math.round(this.height * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.front = this.makeCloud(this.image, frontCrop)
    if (this.profileImage.naturalWidth) {
      this.profile = this.makeCloud(this.profileImage, profileCrop)
    }
    this.invalidate()
  }

  private makeCloud = (image: HTMLImageElement, crop: Crop): Cloud | null => {
    if (!image.naturalWidth || !image.naturalHeight) return null
    const columns = this.mobile ? 92 : 120
    const rows = this.mobile ? 106 : 138
    const sample = document.createElement('canvas')
    sample.width = columns
    sample.height = rows
    const context = sample.getContext('2d', { willReadFrequently: true })
    if (!context) return null

    const cropX = crop.x * image.naturalWidth
    const cropY = crop.y * image.naturalHeight
    const cropWidth = crop.width * image.naturalWidth
    const cropHeight = crop.height * image.naturalHeight
    const fit = Math.min(columns / cropWidth, rows / cropHeight)
    const drawWidth = cropWidth * fit
    const drawHeight = cropHeight * fit
    const offsetX = (columns - drawWidth) / 2
    const offsetY = (rows - drawHeight) / 2
    context.clearRect(0, 0, columns, rows)
    context.drawImage(image, cropX, cropY, cropWidth, cropHeight, offsetX, offsetY, drawWidth, drawHeight)
    const pixels = context.getImageData(0, 0, columns, rows).data
    const aspect = cropWidth / cropHeight
    const boxHeight = Math.min(this.height * 0.62, this.width * 0.64 / aspect)
    const boxWidth = boxHeight * aspect
    const left = (this.width - boxWidth) / 2
    const top = (this.height - boxHeight) / 2
    const points: Point[] = []

    for (let y = 2; y < rows - 2; y += 2) {
      for (let x = 2; x < columns - 2; x += 2) {
        const index = (y * columns + x) * 4
        if (pixels[index + 3] < 80) continue
        const center = luma(pixels, index)
        const horizontal = luma(pixels, index + 4) - luma(pixels, index - 4)
        const vertical = luma(pixels, index + columns * 4) - luma(pixels, index - columns * 4)
        const edge = Math.min(1, Math.hypot(horizontal, vertical) * 2.8)
        const nx = (x - offsetX) / drawWidth
        const ny = (y - offsetY) / drawHeight
        const silhouetteWidth = crop === profileCrop ? 0.62 : 0.51
        const silhouette = ((nx - 0.5) / silhouetteWidth) ** 2 + ((ny - 0.5) / 0.54) ** 2
        if (silhouette > 1.04) continue
        const detail = Math.max(edge, Math.max(0, 0.9 - center) * 0.52)

        const faceDepth = Math.sqrt(Math.max(0, 1 - silhouette)) * 26
        const noseDepth = 15 * Math.exp(-(((nx - 0.51) / 0.12) ** 2 + ((ny - 0.53) / 0.12) ** 2))
        const phase = random(y * columns + x)
        points.push({
          x: left + ((x - offsetX) / drawWidth) * boxWidth,
          y: top + ((y - offsetY) / drawHeight) * boxHeight,
          z: faceDepth + noseDepth,
          shade: Math.round(138 + center * 100 + edge * 18),
          radius: 0.7 + detail * 0.56,
          phase: phase * Math.PI * 2,
        })
      }
    }

    return { points, width: boxWidth, height: boxHeight, cx: this.width / 2, cy: this.height / 2 }
  }

  private tick = (now: number) => {
    this.frame = 0
    if (this.dead) return
    if (this.startTime === null) this.startTime = now
    this.clock = (now - this.startTime) / 1000
    this.draw()
  }

  private drawCloud = (cloud: Cloud, opacity: number, yaw: number, spread: number, zoom: number, scale: number, horizontalScale = 1) => {
    if (!cloud || opacity <= 0.01) return
    const c = this.ctx
    const cosine = Math.cos(yaw)
    const sine = Math.sin(yaw)
    const focalLength = Math.max(360, Math.min(this.width, this.height) * 1.25)
    const zoomScale = 1 + zoom * 3.7
    c.save()
    c.globalCompositeOperation = 'lighter'
    for (const point of cloud.points) {
      const drift = Math.sin(this.clock * 1.35 + point.phase) * 0.45
      const scatterX = (random(point.phase * 997) - 0.5) * this.width * 0.68
      const scatterY = (random(point.phase * 431) - 0.5) * this.height * 0.64
      const x0 = point.x + (scatterX - (point.x - cloud.cx)) * spread
      const y0 = point.y + (scatterY - (point.y - cloud.cy)) * spread
      const dx = x0 - cloud.cx
      const dy = y0 - cloud.cy
      const rotatedX = dx * cosine + point.z * sine
      const rotatedZ = -dx * sine + point.z * cosine
      const perspective = focalLength / Math.max(focalLength * 0.58, focalLength - rotatedZ)
      const x = this.width / 2 + rotatedX * perspective * zoomScale * scale * horizontalScale
      const y = this.height / 2 + dy * perspective * zoomScale * scale
      const alpha = opacity * (0.72 + random(point.phase * 131) * 0.24)
      c.globalAlpha = alpha
      c.fillStyle = 'rgb(' + point.shade + ',' + point.shade + ',' + Math.min(255, point.shade + 5) + ')'
      c.beginPath()
      c.arc(x, y, Math.max(0.55, point.radius * (1 + Math.abs(drift)) * (1 + zoom * 0.5) * scale), 0, Math.PI * 2)
      c.fill()
    }
    c.restore()
  }

  private draw = () => {
    const c = this.ctx
    const w = this.width
    const h = this.height
    const breach = clamp(this.progress.breach)
    const identity = smooth(this.progress.identity)
    const turn = smooth(this.progress.turn)
    const collapse = smooth(this.progress.collapse)
    const zoom = clamp(this.zoom.value)
    c.fillStyle = '#000'
    c.fillRect(0, 0, w, h)

    const amount = Math.floor(2 ** (breach * (this.mobile ? 8 : 9)))
    const arrowFade = 1 - smooth(identity / 0.38)
    const arrowScale = (0.72 + breach * 0.32) * arrowFade
    for (let i = 0; i < amount; i++) {
      const x = amount === 1 ? w / 2 : random(i + 4) * w
      const y = amount === 1 ? h / 2 : random(i + 700) * h
      const target = this.front?.points[i % Math.max(1, this.front.points.length)]
      const mix = identity * 0.72
      const px = target ? x + (target.x - x) * mix : x
      const py = target ? y + (target.y - y) * mix : y
      const alpha = (1 - identity) * (0.35 + random(i + 42) * 0.42)
      if (alpha < 0.02 || arrowScale < 0.02) continue
      c.save()
      c.globalAlpha = alpha
      c.translate(px, py)
      c.scale(arrowScale, arrowScale)
      c.beginPath()
      c.moveTo(0, 0)
      c.lineTo(0, 17)
      c.lineTo(4.6, 12.7)
      c.lineTo(8.1, 20)
      c.lineTo(11, 18.5)
      c.lineTo(7.3, 11.4)
      c.lineTo(13, 11.2)
      c.closePath()
      c.fillStyle = '#e4e7ea'
      c.fill()
      c.strokeStyle = 'rgba(8,9,11,.92)'
      c.lineWidth = 0.9
      c.stroke()
      c.restore()
    }
    c.globalAlpha = 1

    const profileMix = this.profile ? smooth((turn - 0.42) / 0.58) : 0
    const spread = (1 - identity) * 0.68
    const yaw = this.profile ? turn * 1.28 : 0
    const faceScale = (0.08 + identity * 0.92) * (1 - collapse * 0.9)
    const faceOpacity = smooth(identity * 1.8) * (1 - collapse)
    if (this.front && faceOpacity > 0.02 && profileMix < 0.35) {
      const cropX = frontCrop.x * this.image.naturalWidth
      const cropY = frontCrop.y * this.image.naturalHeight
      const cropWidth = frontCrop.width * this.image.naturalWidth
      const cropHeight = frontCrop.height * this.image.naturalHeight
      const imageScale = 1 + zoom * 3.7
      const imageWidth = this.front.width * imageScale * faceScale * Math.max(0.18, Math.cos(yaw))
      const imageHeight = this.front.height * imageScale * faceScale
      c.save()
      c.globalAlpha = faceOpacity * (1 - profileMix) * 0.48
      c.filter = 'grayscale(1) contrast(1.2) brightness(.72)'
      c.beginPath()
      c.ellipse(w / 2, h / 2, imageWidth * 0.51, imageHeight * 0.54, 0, 0, Math.PI * 2)
      c.clip()
      c.drawImage(this.image, cropX, cropY, cropWidth, cropHeight, w / 2 - imageWidth / 2, h / 2 - imageHeight / 2, imageWidth, imageHeight)
      c.restore()
    }
    if (this.profile && profileMix > 0.02) {
      const cropX = profileCrop.x * this.profileImage.naturalWidth
      const cropY = profileCrop.y * this.profileImage.naturalHeight
      const cropWidth = profileCrop.width * this.profileImage.naturalWidth
      const cropHeight = profileCrop.height * this.profileImage.naturalHeight
      const imageScale = 1 + zoom * 3.7
      const imageWidth = this.profile.width * imageScale * faceScale * 0.68
      const imageHeight = this.profile.height * imageScale * faceScale
      c.save()
      c.globalAlpha = profileMix * (1 - collapse) * 0.52
      c.filter = 'grayscale(1) contrast(1.2) brightness(.72)'
      c.drawImage(this.profileImage, cropX, cropY, cropWidth, cropHeight, w / 2 - imageWidth / 2, h / 2 - imageHeight / 2, imageWidth, imageHeight)
      c.restore()
    }
    if (this.front) this.drawCloud(this.front, faceOpacity * (1 - profileMix), yaw, spread, zoom, faceScale)
    if (this.profile) this.drawCloud(this.profile, profileMix * (1 - collapse), 0, spread, zoom, faceScale, 0.68)
  }
}
