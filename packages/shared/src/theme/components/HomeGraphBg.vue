<template>
  <canvas
    ref="canvasRef"
    aria-hidden="true"
    class="absolute inset-0 w-full h-full pointer-events-none select-none z-[1]"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import rawGraph from '@app/link-graph.json'
import { CAT_COLORS, BRAND_TEAL_DARK, BRAND_TEAL_LIGHT } from '../colors'

// ── Graph data ──────────────────────────────────────────────────────────────

type GraphNode = { id: string; title: string; category: string }
type GraphEdge = { source: string; target: string }

const graphNodes = rawGraph.nodes as GraphNode[]
const graphEdges = rawGraph.edges as GraphEdge[]

// Pre-compute degree for each node
const degree: Record<string, number> = {}
graphNodes.forEach(n => { degree[n.id] = 0 })
graphEdges.forEach(e => {
  degree[e.source] = (degree[e.source] ?? 0) + 1
  degree[e.target] = (degree[e.target] ?? 0) + 1
})

// CAT_COLORS imported from ../colors.ts — 11 slots, each [darkRGB, lightRGB]

// Map 19 categories → 11 color slots
const categoryColorIdx: Record<string, number> = {
  'account':                   1,  // brand-1 mint
  'getting-started':           4,  // bright pale — welcoming
  'deposit':                   2,  // brand-2 cyan
  'withdrawal':                9,  // rust orange — cautious/serious
  'transfers-and-fx':          5,  // warm teal
  'stock-trading':             3,  // brand-3
  'derivatives':               6,  // cool aqua — sophisticated
  'margin':                    9,  // rust orange — risk/caution
  'rewards':                   8,  // warm gold — celebratory
  'docs':                      10, // slate gray — neutral
  'funds-and-wealth':          5,  // warm teal — growth
  'app-guide':                 2,  // brand-2 cyan
  'compliance-and-tax':        9,  // rust orange — regulatory/formal
  'troubleshooting':           10, // slate gray — neutral/technical
  'portfolio-and-statements':  3,  // brand-3
  'ipo':                       8,  // warm gold — high-value event
  'market-data':               6,  // cool aqua — data
  'root':                      10, // slate gray — structural
  'graph':                     1,  // brand-1 mint
}

// Build node index map for edge lookups
const nodeIndex: Record<string, number> = {}
graphNodes.forEach((n, i) => { nodeIndex[n.id] = i })

const edgePairs: [number, number][] = []
graphEdges.forEach(e => {
  const si = nodeIndex[e.source]
  const ti = nodeIndex[e.target]
  if (si !== undefined && ti !== undefined) edgePairs.push([si, ti])
})

// Hub nodes (degree ≥ 8) preferred in activation cycles
const hubIndices = graphNodes
  .map((_, i) => i)
  .filter(i => degree[graphNodes[i].id] >= 8)

// ── Particle ────────────────────────────────────────────────────────────────

type Particle = {
  x: number; y: number
  vx: number; vy: number
  baseR: number
  lit: number
  colorIdx: number
  tier: 'small' | 'medium' | 'large'
}

function rng(seed: number): number {
  const s = Math.sin(seed * 9301 + 49297) * 233280
  return s - Math.floor(s)
}

const NODE_COUNT     = graphNodes.length
const CYCLE_MS       = 6000
const ORBIT_RATIO    = 0.09
const EDGE_DIST_RATIO = 0.38

// Category cluster seeds — rough screen regions per topic area
const clusterSeeds: Record<string, [number, number]> = {
  'account':                   [0.15, 0.20],
  'getting-started':           [0.22, 0.45],
  'deposit':                   [0.12, 0.68],
  'withdrawal':                [0.18, 0.82],
  'transfers-and-fx':          [0.08, 0.55],
  'stock-trading':             [0.50, 0.18],
  'derivatives':               [0.62, 0.30],
  'margin':                    [0.42, 0.35],
  'rewards':                   [0.55, 0.55],
  'docs':                      [0.70, 0.22],
  'funds-and-wealth':          [0.80, 0.60],
  'app-guide':                 [0.88, 0.30],
  'compliance-and-tax':        [0.85, 0.78],
  'troubleshooting':           [0.30, 0.78],
  'portfolio-and-statements':  [0.68, 0.75],
  'ipo':                       [0.75, 0.45],
  'market-data':               [0.92, 0.50],
  'root':                      [0.50, 0.90],
  'graph':                     [0.50, 0.50],
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
let rafId = 0
let ro: ResizeObserver | null = null
let mouseCleanup: (() => void) | null = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let W = 0, H = 0

  const resize = () => {
    const r = canvas.getBoundingClientRect()
    W = r.width; H = r.height
    canvas.width  = W * devicePixelRatio
    canvas.height = H * devicePixelRatio
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  }
  resize()
  ro = new ResizeObserver(resize)
  ro.observe(canvas)

  // Mouse tracking for proximity tooltips
  let mouseX = -1, mouseY = -1
  let tooltipAlpha = 0
  let tooltipIdx   = -1
  const onMouseMove  = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY }
  const onMouseLeave = () => { mouseX = -1; mouseY = -1 }
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  canvas.addEventListener('mouseleave', onMouseLeave)
  mouseCleanup = () => {
    window.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('mouseleave', onMouseLeave)
  }

  // Initialize particles from real graph nodes
  const particles: Particle[] = graphNodes.map((n, idx) => {
    const d    = degree[n.id] ?? 0
    const tier: 'small' | 'medium' | 'large' =
      d >= 8 ? 'large' : d >= 3 ? 'medium' : 'small'
    const baseR = tier === 'large'  ? 4.0 + rng(idx * 3.7) * 1.5
                : tier === 'medium' ? 2.4 + rng(idx * 5.1) * 1.0
                :                     1.2 + rng(idx * 2.3) * 0.8
    const seed  = clusterSeeds[n.category] ?? [0.5, 0.5]
    const spread = 0.22
    const x = Math.max(0.04, Math.min(0.96, seed[0] + (rng(idx * 7.3 + 3) - 0.5) * spread))
    const y = Math.max(0.04, Math.min(0.96, seed[1] + (rng(idx * 11.1 + 7) - 0.5) * spread))
    return {
      x, y,
      vx: (rng(idx * 4.9 + 1) - 0.5) * 0.00008,
      vy: (rng(idx * 6.3 + 2) - 0.5) * 0.00008,
      baseR, lit: 0,
      colorIdx: categoryColorIdx[n.category] ?? 0,
      tier,
    }
  })

  const t0 = performance.now()

  const frame = (now: number) => {
    if (W === 0 || H === 0) { rafId = requestAnimationFrame(frame); return }
    ctx.clearRect(0, 0, W, H)

    const dark    = true  // homepage always uses #1b1b1f dark bg
    const elapsed = now - t0
    const phase   = (elapsed % CYCLE_MS) / CYCLE_MS
    const cycle   = Math.floor(elapsed / CYCLE_MS)

    // Center AI node — Lissajous drift
    const orbitR = Math.min(W, H) * ORBIT_RATIO
    const mcx = W * 0.5 + orbitR * Math.sin(elapsed * 0.00031) * Math.cos(elapsed * 0.00019)
    const mcy = H * 0.5 + orbitR * Math.cos(elapsed * 0.00023) * Math.sin(elapsed * 0.00041)

    // Color helpers — rest uses same active color at reduced alpha (preserves hue)
    const ci = dark ? 0 : 1
    const tv = (idx: number, a: number) => `rgba(${CAT_COLORS[idx][ci]},${a.toFixed(3)})`
    // Base brand teal for pulse rings / center node (from colors.ts)
    const baseTeal = dark ? BRAND_TEAL_DARK : BRAND_TEAL_LIGHT
    const t  = (a: number) => `rgba(${baseTeal},${a.toFixed(3)})`

    // Activated nodes — prefer hubs (5 hub + 4 random = 9 total)
    const activeSet = new Set<number>()
    for (let i = 0; i < 5 && hubIndices.length > 0; i++) {
      activeSet.add(hubIndices[Math.floor(rng(cycle * 53 + i * 17.3) * hubIndices.length)])
    }
    for (let i = 0; i < 4; i++) {
      activeSet.add(Math.floor(rng(cycle * 71 + i * 13.7) * NODE_COUNT))
    }

    // Update positions
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy
      if (p.x < 0.03) p.vx =  Math.abs(p.vx)
      if (p.x > 0.97) p.vx = -Math.abs(p.vx)
      if (p.y < 0.03) p.vy =  Math.abs(p.vy)
      if (p.y > 0.97) p.vy = -Math.abs(p.vy)
    }

    // Update lit values
    for (let i = 0; i < NODE_COUNT; i++) {
      const p = particles[i]
      if (activeSet.has(i)) {
        if      (phase >= 0.28 && phase < 0.36) p.lit = Math.min(1, (phase - 0.28) / 0.08)
        else if (phase >= 0.36 && phase < 0.65) p.lit = 1
        else if (phase >= 0.65 && phase < 0.80) p.lit = Math.max(0, 1 - (phase - 0.65) / 0.15)
        else                                     p.lit = 0
      } else {
        p.lit = 0
      }
    }

    // ── Draw real graph edges (lighter alpha) ─────────────────────────────
    const maxEdgePx = Math.min(W, H) * EDGE_DIST_RATIO
    for (const [si, ti] of edgePairs) {
      const a = particles[si], b = particles[ti]
      const dx = (a.x - b.x) * W, dy = (a.y - b.y) * H
      const dist = Math.sqrt(dx * dx + dy * dy)
      const proximity = Math.max(0, 1 - dist / maxEdgePx)
      if (proximity <= 0) continue

      const edgeLit   = Math.max(a.lit, b.lit)
      const baseAlpha = proximity * (dark ? 0.07 : 0.09)
      const litIdx    = a.lit >= b.lit ? a.colorIdx : b.colorIdx

      ctx.beginPath()
      ctx.moveTo(a.x * W, a.y * H)
      ctx.lineTo(b.x * W, b.y * H)
      const alpha = edgeLit > 0 ? baseAlpha + edgeLit * 0.28 : baseAlpha
      ctx.strokeStyle = tv(edgeLit > 0 ? litIdx : a.colorIdx, alpha)
      ctx.lineWidth   = edgeLit > 0 ? 0.9 : 0.4
      ctx.stroke()
    }

    // ── Light beams: activated nodes → center ─────────────────────────────
    if (phase >= 0.46 && phase < 0.80) {
      const beamT = (phase - 0.46) / 0.34
      for (const p of particles) {
        if (p.lit <= 0) continue
        const alpha = p.lit * 0.38 * (1 - beamT * beamT)
        const grad  = ctx.createLinearGradient(p.x * W, p.y * H, mcx, mcy)
        grad.addColorStop(0,   tv(p.colorIdx, 0))
        grad.addColorStop(0.4, tv(p.colorIdx, alpha))
        grad.addColorStop(1,   tv(p.colorIdx, alpha * 1.3))
        ctx.beginPath()
        ctx.moveTo(p.x * W, p.y * H)
        ctx.lineTo(mcx, mcy)
        ctx.strokeStyle = grad
        ctx.lineWidth   = p.lit * 0.9
        ctx.stroke()
      }
    }

    // ── Query pulse rings ─────────────────────────────────────────────────
    if (phase >= 0.15 && phase < 0.40) {
      const pT   = (phase - 0.15) / 0.25
      const maxR = Math.sqrt(W * W + H * H) * 0.58
      ctx.beginPath()
      ctx.arc(mcx, mcy, pT * maxR, 0, Math.PI * 2)
      ctx.strokeStyle = t((1 - pT) * 0.16)
      ctx.lineWidth   = 1.5; ctx.stroke()
      const pT2 = Math.max(0, pT - 0.20)
      ctx.beginPath()
      ctx.arc(mcx, mcy, pT2 * maxR, 0, Math.PI * 2)
      ctx.strokeStyle = t((1 - pT2) * 0.09)
      ctx.lineWidth   = 1.0; ctx.stroke()
    }

    // ── Draw document nodes ───────────────────────────────────────────────
    for (const p of particles) {
      const px = p.x * W, py = p.y * H
      const r  = p.baseR + p.lit * 2.4

      if (p.lit > 0) {
        const haloFactor = p.tier === 'large' ? 8 : p.tier === 'medium' ? 6 : 4
        const haloAlpha  = p.lit * (p.tier === 'large' ? 0.24 : 0.17)
        const halo = ctx.createRadialGradient(px, py, 0, px, py, r * haloFactor)
        halo.addColorStop(0, tv(p.colorIdx, haloAlpha))
        halo.addColorStop(1, tv(p.colorIdx, 0))
        ctx.beginPath(); ctx.arc(px, py, r * haloFactor, 0, Math.PI * 2)
        ctx.fillStyle = halo; ctx.fill()

        const coreAlpha = p.tier === 'large' ? 0.82 + p.lit * 0.18 : 0.68 + p.lit * 0.32
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fillStyle = tv(p.colorIdx, coreAlpha); ctx.fill()
      } else {
        // Rest state: full active color at lower opacity — preserves hue identity
        const restAlpha = p.tier === 'large'  ? (dark ? 0.68 : 0.65)
                        : p.tier === 'medium' ? (dark ? 0.48 : 0.44)
                        :                       (dark ? 0.32 : 0.28)
        ctx.beginPath(); ctx.arc(px, py, p.baseR, 0, Math.PI * 2)
        ctx.fillStyle = tv(p.colorIdx, restAlpha); ctx.fill()
      }
    }

    // ── Center AI node ────────────────────────────────────────────────────
    const rp1 = (phase * 2.5) % 1
    const rp2 = (phase * 2.5 + 0.5) % 1
    ctx.beginPath(); ctx.arc(mcx, mcy, 5 + rp1 * 14, 0, Math.PI * 2)
    ctx.strokeStyle = t((1 - rp1) * 0.18); ctx.lineWidth = 1.2; ctx.stroke()
    ctx.beginPath(); ctx.arc(mcx, mcy, 5 + rp2 * 14, 0, Math.PI * 2)
    ctx.strokeStyle = t((1 - rp2) * 0.11); ctx.lineWidth = 0.8; ctx.stroke()

    const coreGlow = ctx.createRadialGradient(mcx, mcy, 0, mcx, mcy, 10)
    coreGlow.addColorStop(0, t(0.88)); coreGlow.addColorStop(1, t(0))
    ctx.beginPath(); ctx.arc(mcx, mcy, 10, 0, Math.PI * 2)
    ctx.fillStyle = coreGlow; ctx.fill()
    ctx.beginPath(); ctx.arc(mcx, mcy, 4.5, 0, Math.PI * 2)
    ctx.fillStyle = t(0.92); ctx.fill()

    // ── Proximity tooltip ─────────────────────────────────────────────────
    {
      const HOVER_R = 54
      let nearIdx = -1, nearDist = Infinity
      if (mouseX >= 0) {
        const rect = canvas.getBoundingClientRect()
        const mx = mouseX - rect.left
        const my = mouseY - rect.top
        for (let i = 0; i < NODE_COUNT; i++) {
          const p = particles[i]
          const dx = p.x * W - mx, dy = p.y * H - my
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < HOVER_R && d < nearDist) { nearDist = d; nearIdx = i }
        }
      }
      if (nearIdx >= 0) tooltipIdx = nearIdx
      tooltipAlpha += ((nearIdx >= 0 ? 1 : 0) - tooltipAlpha) * 0.14

      if (tooltipAlpha > 0.005 && tooltipIdx >= 0) {
        const p     = particles[tooltipIdx]
        const px    = p.x * W, py = p.y * H
        const title = graphNodes[tooltipIdx].title

        ctx.save()
        ctx.font = '600 12px system-ui, -apple-system, sans-serif'
        const tw   = ctx.measureText(title).width
        const padX = 13, bh = 28, bw = tw + padX * 2
        const gap  = p.baseR + 10
        const bx   = Math.max(4, Math.min(W - bw - 4, px - bw / 2))
        const isAbove = py - gap - bh >= 6
        const by   = isAbove ? py - gap - bh : py + gap

        ctx.globalAlpha = tooltipAlpha

        // Connector dash
        ctx.beginPath()
        ctx.setLineDash([2, 3])
        ctx.moveTo(px, isAbove ? py - p.baseR - 2 : py + p.baseR + 2)
        ctx.lineTo(px, isAbove ? by + bh : by)
        ctx.strokeStyle = tv(p.colorIdx, 0.45)
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.setLineDash([])

        // Backdrop (manual roundRect for broad compat)
        const r = 7
        ctx.beginPath()
        ctx.moveTo(bx + r, by)
        ctx.lineTo(bx + bw - r, by)
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r)
        ctx.lineTo(bx + bw, by + bh - r)
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh)
        ctx.lineTo(bx + r, by + bh)
        ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r)
        ctx.lineTo(bx, by + r)
        ctx.quadraticCurveTo(bx, by, bx + r, by)
        ctx.closePath()
        ctx.fillStyle = dark ? 'rgba(14,24,22,0.90)' : 'rgba(246,253,252,0.95)'
        ctx.fill()
        // Tinted border using node's color
        ctx.strokeStyle = tv(p.colorIdx, dark ? 0.44 : 0.32)
        ctx.lineWidth = 1
        ctx.stroke()

        // Label text
        ctx.fillStyle = dark ? 'rgba(205,248,240,0.92)' : 'rgba(16,36,34,0.86)'
        ctx.textBaseline = 'middle'
        ctx.fillText(title, bx + padX, by + bh / 2)
        ctx.restore()
      }
    }

    rafId = requestAnimationFrame(frame)
  }

  rafId = requestAnimationFrame(frame)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (ro) ro.disconnect()
  if (mouseCleanup) mouseCleanup()
})
</script>
