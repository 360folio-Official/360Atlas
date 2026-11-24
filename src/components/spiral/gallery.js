// Spiral gallery engine (OGL / WebGL).
// A vertical-axis cylinder VIEWED FROM THE SIDE: one card faces the viewer at
// the front (the focus), cards flip in from the top, turn to face you at centre,
// and flip out at the bottom — a continuous flip → face → flip spiral that loops.
//
// Usage:
//   import { Gallery } from './gallery.js'
//   const g = new Gallery(canvas, items, { onHover, onFocus, config })
//   // drive it from a scroll source (see integration.md):
//   g.setScroll(progress0to1)   // which card is in focus
//   g.setVelocity(pxPerSec)     // bend intensity follows scroll speed
//   g.destroy()                 // on unmount
//
// items: [{ img: '/path/to/uniform-card.webp', ...anything }]
//   - `img` MUST point to a UNIFORM card (same size/aspect for every item).
//     Use make-cards.py to bake raw images/cutouts into uniform cards first.
//   - the whole item object is handed back to onHover/onFocus so the host can
//     render a details panel (title, price, etc.).
//
// Requires: npm i ogl

import { Renderer, Camera, Transform, Plane, Program, Mesh, Texture, Raycast, Vec2 } from 'ogl'

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uSpeed;
  uniform float uTime;
  uniform float uBend;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    // Rubber-sheet bend, scaled by scroll speed (keep it subtle).
    p.z += sin(uv.x * 3.14159) * uSpeed * uBend;
    p.z += sin(uv.y * 3.14159 + uTime * 0.3) * uSpeed * uBend * 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uAlpha;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(tMap, vUv);
    if (c.a < 0.01) discard;
    gl_FragColor = vec4(c.rgb, c.a * uAlpha);
  }
`

const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

// ---- tuning knobs (all overridable via the `config` constructor option) ----
export const DEFAULT_CONFIG = {
  fov: 42, // camera field of view
  camZ: 8.5, // camera distance — larger shows more of the tall journey
  radius: 2.2, // cylinder radius — SMALLER = tighter spiral, fewer cards facing front
  dTheta: 0.6, // radians of flip per card — LARGER = fewer cards face the viewer
  dY: 0.72, // vertical rise per card — LARGER = steeper/taller spiral
  cardAspect: 600 / 450, // width / height of the uniform cards (must match make-cards.py)
  cardH: 1.0, // card height in world units (apparent size)
  bend: 0.7, // bend intensity multiplier (lower = calmer)
  velocityDivisor: 5200, // higher = less bend per unit of scroll speed
  fadeStart: 0.62, // fraction of viewport half-height where cards begin to fade
  fadeEnd: 1.02, // fraction where cards are fully faded (entering top / exiting bottom)
  ease: 0.08, // scroll smoothing (lower = laggier/smoother)
}

class Media {
  constructor({ gl, scene, item, index, count, cfg }) {
    this.gl = gl
    this.item = item
    this.index = index
    this.count = count
    this.cfg = cfg
    this.d = 999
    this.alpha = 0

    this.program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      depthTest: false,
      cullFace: false, // double-sided: flipped (entering/exiting) cards still show
      uniforms: {
        tMap: { value: new Texture(gl) },
        uSpeed: { value: 0 },
        uTime: { value: 0 },
        uBend: { value: cfg.bend },
        uAlpha: { value: 0 },
      },
    })
    this.geometry = new Plane(gl, { widthSegments: 18, heightSegments: 14 })
    this.mesh = new Mesh(gl, { geometry: this.geometry, program: this.program })
    this.mesh.setParent(scene)
    this.mesh.media = this
    this.mesh.scale.set(0, 0, 1)

    const img = new Image()
    img.src = item.img
    img.onload = () => {
      const tex = this.program.uniforms.tMap.value
      tex.image = img
      tex.needsUpdate = true
      this.loaded = true
    }
  }

  update(scroll, speed, time) {
    const N = this.count
    const { dTheta, dY, radius, vh, fadeStart, fadeEnd } = this.cfg
    // signed circular distance from the focus (the card at index == scroll)
    let d = this.index - scroll
    d = ((d % N) + N) % N
    if (d > N / 2) d -= N
    this.d = d

    // Journey as scroll advances (d: + → 0 → -):
    //   d>0  upper-right, flipping, fading in from the top   (entering arc)
    //   d=0  dead-centre, un-flipped, facing the viewer       (the focus)
    //   d<0  lower-left, flipping away, fading out the bottom  (exiting arc)
    const theta = d * dTheta
    const cos = Math.cos(theta)
    const y = d * dY
    this.mesh.position.set(Math.sin(theta) * radius, y, cos * radius)
    this.mesh.rotation.y = theta // flips with the cylinder wall

    // FADE ONLY by vertical position (never by flip angle) — keeps the flipped
    // entering/exiting arcs visible. Size stays constant.
    this.alpha = 1 - smooth(vh * fadeStart, vh * fadeEnd, Math.abs(y))

    if (this.loaded) this.mesh.scale.set(this.cfg.cardW, this.cfg.cardH, 1)
    this.program.uniforms.uSpeed.value = speed
    this.program.uniforms.uTime.value = time
    this.program.uniforms.uAlpha.value = this.alpha
  }
}

export class Gallery {
  constructor(canvas, items, { onHover, onFocus, config } = {}) {
    this.canvas = canvas
    this.items = items
    this.onHover = onHover || (() => {})
    this.onFocus = onFocus || (() => {})
    this.cfg = { ...DEFAULT_CONFIG, ...config }

    this.scroll = 0
    this.scrollTarget = 0
    this.speed = 0
    this.speedTarget = 0
    this.time = 0
    this.lastHover = null
    this.lastFocus = null

    this.renderer = new Renderer({ canvas, alpha: true, dpr: Math.min(window.devicePixelRatio, 2) })
    this.gl = this.renderer.gl
    this.gl.clearColor(0, 0, 0, 0)
    this.camera = new Camera(this.gl, { fov: this.cfg.fov })
    this.camera.position.z = this.cfg.camZ
    this.scene = new Transform()

    this.raycast = new Raycast()
    this.mouse = new Vec2()
    this.hovering = false

    this.resize()
    this.build()

    this.onResize = () => this.resize()
    window.addEventListener('resize', this.onResize)
    this.onMove = (e) => this.handleMove(e)
    canvas.addEventListener('pointermove', this.onMove)
    this.onLeave = () => {
      this.hovering = false
      this.lastHover = null
      this.onHover(null)
    }
    canvas.addEventListener('pointerleave', this.onLeave)

    this.raf = requestAnimationFrame(this.loop)
  }

  resize() {
    const host = this.canvas.parentElement || this.canvas
    const rect = host.getBoundingClientRect()
    const w = rect.width || window.innerWidth
    const h = rect.height || window.innerHeight
    this.renderer.setSize(w, h)
    this.camera.perspective({ aspect: w / h })
  }

  build() {
    this.medias = []
    const fov = (this.cfg.fov * Math.PI) / 180
    this.cfg.vh = Math.tan(fov / 2) * this.cfg.camZ // viewport half-height (world)
    this.cfg.cardH = this.cfg.cardH
    this.cfg.cardW = this.cfg.cardH * this.cfg.cardAspect
    this.items.forEach((item, index) => {
      this.medias.push(
        new Media({ gl: this.gl, scene: this.scene, item, index, count: this.items.length, cfg: this.cfg })
      )
    })
  }

  // progress 0..1 → the focus travels through every card once, then loops
  setScroll(progress) {
    this.scrollTarget = progress * this.items.length
  }

  setVelocity(v) {
    const c = 0.8
    this.speedTarget = Math.max(-c, Math.min(c, v / this.cfg.velocityDivisor))
  }

  handleMove(e) {
    const rect = this.canvas.getBoundingClientRect()
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    this.hovering = true
  }

  pick() {
    if (!this.hovering || !this.medias.length) return
    this.raycast.castMouse(this.camera, this.mouse)
    const meshes = this.medias.filter((m) => m.alpha > 0.35).map((m) => m.mesh)
    const hits = this.raycast.intersectBounds(meshes)
    const hit = hits[0]?.media?.item || null
    if (hit !== this.lastHover) {
      this.lastHover = hit
      this.onHover(hit)
    }
  }

  focus() {
    let best = null
    let bestD = 1e9
    for (const m of this.medias) {
      if (Math.abs(m.d) < bestD) {
        bestD = Math.abs(m.d)
        best = m
      }
    }
    const item = best?.item || null
    if (item !== this.lastFocus) {
      this.lastFocus = item
      this.onFocus(item)
    }
  }

  loop = () => {
    this.raf = requestAnimationFrame(this.loop)
    this.time += 0.016
    this.scroll += (this.scrollTarget - this.scroll) * this.cfg.ease
    this.speed += (this.speedTarget - this.speed) * 0.1
    this.speedTarget *= 0.92
    this.medias.forEach((m) => m.update(this.scroll, this.speed, this.time))
    // draw far → near so nearer cards sit on top (depth test is off)
    const order = [...this.medias].sort((a, b) => a.mesh.position.z - b.mesh.position.z)
    this.scene.children = order.map((m) => m.mesh)
    // refresh world matrices so the raycast tests current card positions
    this.camera.updateMatrixWorld()
    this.scene.updateMatrixWorld()
    this.pick()
    this.focus()
    this.renderer.render({ scene: this.scene, camera: this.camera })
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.onResize)
    this.canvas.removeEventListener('pointermove', this.onMove)
    this.canvas.removeEventListener('pointerleave', this.onLeave)
    // Do NOT call loseContext(): the canvas is reused on remount/route revisit
    // and a force-lost context cannot be re-acquired on the same canvas.
  }
}
