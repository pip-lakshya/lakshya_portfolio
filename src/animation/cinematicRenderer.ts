export interface IntroProgress { breach: number; identity: number; collapse: number }
interface Point { x: number; y: number; sx: number; sy: number; z: number; shade: number; r: number; phase: number }
const clamp=(n:number)=>Math.max(0,Math.min(1,n))
const ease=(n:number)=>{n=clamp(n);return n*n*(3-2*n)}
const rand=(n:number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}

export class CinematicRenderer {
  private ctx: CanvasRenderingContext2D
  private canvas: HTMLCanvasElement
  private image: HTMLImageElement
  private progress: IntroProgress
  private zoom: {value:number}
  private observer: ResizeObserver
  private points: Point[]=[]
  private w=1
  private h=1
  private dpr=1
  private frame=0
  private dead=false
  private last=0
  private clock=0
  private readonly mobile=matchMedia('(max-width: 640px)').matches
  constructor(canvas:HTMLCanvasElement,image:HTMLImageElement,progress:IntroProgress,zoom:{value:number}) {
    this.canvas=canvas;this.image=image;this.progress=progress;this.zoom=zoom
    const ctx=canvas.getContext('2d',{alpha:false})
    if(!ctx) throw new Error('Canvas 2D unavailable')
    this.ctx=ctx
    this.observer=new ResizeObserver(()=>this.resize())
    this.observer.observe(canvas);this.resize();this.frame=requestAnimationFrame(this.tick)
  }
  invalidate=()=>{this.last=0}
  setPointer=(_x:number,_y:number)=>{}
  destroy=()=>{this.dead=true;cancelAnimationFrame(this.frame);this.observer.disconnect()}
  private resize=()=>{
    const rect=this.canvas.getBoundingClientRect();this.w=Math.max(1,rect.width);this.h=Math.max(1,rect.height)
    this.dpr=Math.min(devicePixelRatio||1,this.mobile?1.25:1.6)
    this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr)
    this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);this.makePoints();this.last=0
  }
  private makePoints=()=>{
    const cols=this.mobile?64:104, crop={x:this.image.naturalWidth*.18,y:this.image.naturalHeight*.015,w:this.image.naturalWidth*.66,h:this.image.naturalHeight*.67}, rows=Math.round(cols*crop.h/crop.w)
    const sample=document.createElement('canvas');sample.width=cols;sample.height=rows
    const c=sample.getContext('2d',{willReadFrequently:true});if(!c)return
    c.drawImage(this.image,crop.x,crop.y,crop.w,crop.h,0,0,cols,rows)
    const data=c.getImageData(0,0,cols,rows).data
    const scale=Math.min(this.w*.68/cols,this.h*.66/rows),left=(this.w-cols*scale)/2,top=(this.h-rows*scale)/2
    this.points=[]
    for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){
      const i=(y*cols+x)*4, lum=(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722)/255
      const lx=(data[i-4]*.2126+data[i-3]*.7152+data[i-2]*.0722)/255
      const rx=(data[i+4]*.2126+data[i+5]*.7152+data[i+6]*.0722)/255
      const uy=(data[i-cols*4]*.2126+data[i-cols*4+1]*.7152+data[i-cols*4+2]*.0722)/255
      const dy=(data[i+cols*4]*.2126+data[i+cols*4+1]*.7152+data[i+cols*4+2]*.0722)/255
      const edge=Math.min(1,Math.hypot(rx-lx,dy-uy)*3.4)
      const nx=x/cols,ny=y/rows,ellipse=((nx-.5)/.49)**2+((ny-.5)/.51)**2
      const facial=Math.max(edge*.85,Math.max(0,(.86-lum)*.48))
      if(ellipse>1||rand(y*cols+x)>facial*.82+.06)continue
      const px=left+x*scale,py=top+y*scale
      const id=this.points.length+1
      this.points.push({x:px,y:py,sx:(rand(id+91)-.5)*this.w*1.25,sy:(rand(id+177)-.5)*this.h*1.3,z:rand(id+240)*2-1,shade:Math.round(150+lum*105+edge*35),r:.55+rand(id+500)*.75,phase:rand(id+911)*Math.PI*2})
    }
  }
  private tick=(now:number)=>{
    if(this.dead)return
    this.clock=now/1000
    const active=this.progress.breach<1||this.progress.identity<1||this.progress.collapse<1||this.zoom.value>0&&this.zoom.value<1
    if(active||this.last===0){this.draw();this.last=now}
    this.frame=requestAnimationFrame(this.tick)
  }
  private draw=()=>{
    const c=this.ctx,w=this.w,h=this.h,p=this.progress
    c.fillStyle='#000';c.fillRect(0,0,w,h)
    const breach=clamp(p.breach),identity=ease(p.identity),collapse=ease(p.collapse),zoom=clamp(this.zoom.value)
    const amount=Math.floor(1+breach*(this.mobile?185:340))
    const swarmAlpha=1-identity
    for(let i=0;i<amount;i++){
      const t=this.clock,baseX=rand(i+4)*w,baseY=rand(i+700)*h
      const chaos=1+identity*1.6
      let x=baseX+Math.sin(t*1.8+i*1.7)*16*chaos,y=baseY+Math.cos(t*1.47+i*.81)*13*chaos
      if(identity>.02){const target=this.points[i%Math.max(1,this.points.length)];x+=(target?.x??w/2-x)*identity*.68;y+=(target?.y??h/2-y)*identity*.68}
      const a=swarmAlpha*(.46+rand(i+42)*.5)
      if(a<=.015)continue
      c.save();c.translate(x,y);c.rotate(Math.sin(t+i)*.16);c.globalAlpha=a;c.strokeStyle='#f0f2f4';c.fillStyle='#fff';c.lineWidth=1.25
      c.beginPath();c.moveTo(0,0);c.lineTo(0,12);c.lineTo(3.4,9);c.lineTo(6.7,15);c.lineTo(9,13.8);c.lineTo(5.5,8);c.lineTo(10,7.8);c.closePath();c.fill();c.stroke();c.restore()
    }
    if(identity>.001){
      const pointAlpha=identity*(1-collapse)+collapse
      const spread=collapse*(1-zoom)*.92
      const depth=zoom
      c.save();c.globalCompositeOperation='lighter'
      for(const q of this.points){
        const wave=Math.sin(this.clock*2+q.phase)*.9
        const scatterX=q.sx+Math.sin(this.clock*1.3+q.phase)*24
        const scatterY=q.sy+Math.cos(this.clock*1.1+q.phase)*24
        let x=q.x+(scatterX-q.x)*spread,y=q.y+(scatterY-q.y)*spread
        const scale=1+depth*5
        x=w/2+(x-w/2)*scale;y=h/2+(y-h/2)*scale
        const alpha=pointAlpha*(.58+rand(q.phase*100)*.38)
        const r=q.r*(1+collapse*.65+Math.abs(wave)*.22)
        c.globalAlpha=alpha;c.fillStyle=`rgb(${q.shade},${q.shade},${Math.min(255,q.shade+4)})`
        c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()
      }
      c.restore()
    }
  }
}
