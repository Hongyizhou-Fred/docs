<template>
  <div class="link-graph-container" ref="containerRef">
    <canvas ref="canvasRef" @wheel.prevent="onWheel" @mousedown="onMouseDown"
      @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseLeave"
      @click="onClick" />
    <div v-if="tooltip.visible" class="graph-tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      {{ tooltip.text }}
    </div>
    <div class="graph-controls">
      <button @click="resetView" :title="t('graph.resetView')">⟳</button>
    </div>
    <div class="graph-legend">
      <div v-for="(color, cat) in visibleCategories" :key="cat" class="legend-item">
        <span class="legend-dot" :style="{ background: color }" />
        <span>{{ categoryLabel(cat) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { useRouter } from 'vitepress'
import graphDataRaw from '@app/link-graph.json'
import { CATEGORY_COLORS } from '../colors'
import { useI18n } from '../../i18n/useI18n'

const { t } = useI18n()

// ------- 类型 -------

interface NodeData {
  id: string
  title: string
  category: string
}

interface SimNode extends NodeData {
  x: number
  y: number
  vx: number
  vy: number
  fixed: boolean
}

interface SimEdge {
  source: SimNode
  target: SimNode
}

// ------- 常量 -------

// CATEGORY_COLORS imported from ../colors.ts

const categoryLabel = (cat: string) => t('graph.categoryLabels.' + cat) || cat

// 力导向参数
const REPULSION = 3000
const SPRING_STRENGTH = 0.04
const REST_LENGTH = 110
const DAMPING = 0.78
const GRAVITY = 0.008
const NODE_RADIUS = 5
const NODE_RADIUS_HOVER = 8

// ------- 状态 -------

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const router = useRouter()

const tooltip = reactive({ visible: false, x: 0, y: 0, text: '' })

// 画布尺寸（设备像素）
let canvasW = 0
let canvasH = 0
let dpr = 1

// 视图变换
let tx = 0, ty = 0, scale = 1

// 模拟节点
const simNodes: SimNode[] = []
const simEdges: SimEdge[] = []
const nodeIndex = new Map<string, SimNode>()

// 交互状态
let animFrame: number | null = null
let alpha = 1.0
const ALPHA_DECAY = 0.015
const ALPHA_MIN = 0.001

let isDraggingNode = false
let isDraggingCanvas = false
let dragNode: SimNode | null = null
let panStart = { x: 0, y: 0, tx: 0, ty: 0 }
let hoverNode: SimNode | null = null

// ------- 计算属性 -------

const visibleCategories = computed(() => {
  const cats = new Set(simNodes.map(n => n.category))
  return Object.fromEntries(
    Object.entries(CATEGORY_COLORS).filter(([k]) => cats.has(k))
  )
})

// ------- 力模拟 -------

function initSimulation() {
  const { nodes, edges } = graphDataRaw as { nodes: NodeData[]; edges: { source: string; target: string }[] }
  const cx = canvasW / dpr / 2
  const cy = canvasH / dpr / 2

  // 节点初始位置按分类分簇
  const catCenters: Record<string, { x: number; y: number }> = {}
  const catList = [...new Set(nodes.map(n => n.category))]
  catList.forEach((cat, i) => {
    const angle = (i / catList.length) * Math.PI * 2
    catCenters[cat] = {
      x: cx + Math.cos(angle) * 200,
      y: cy + Math.sin(angle) * 200,
    }
  })

  simNodes.length = 0
  nodeIndex.clear()
  for (const n of nodes) {
    const c = catCenters[n.category] || { x: cx, y: cy }
    const node: SimNode = {
      ...n,
      x: c.x + (Math.random() - 0.5) * 80,
      y: c.y + (Math.random() - 0.5) * 80,
      vx: 0, vy: 0,
      fixed: false,
    }
    simNodes.push(node)
    nodeIndex.set(n.id, node)
  }

  simEdges.length = 0
  for (const e of edges) {
    const s = nodeIndex.get(e.source)
    const t = nodeIndex.get(e.target)
    if (s && t) simEdges.push({ source: s, target: t })
  }
}

function tick() {
  const cx = canvasW / dpr / 2
  const cy = canvasH / dpr / 2

  // 斥力（Barnes-Hut 近似简化：仍为 O(n²) 但对 200 节点足够）
  for (let i = 0; i < simNodes.length; i++) {
    for (let j = i + 1; j < simNodes.length; j++) {
      const a = simNodes[i], b = simNodes[j]
      const dx = a.x - b.x || 0.01
      const dy = a.y - b.y || 0.01
      const distSq = dx * dx + dy * dy
      const dist = Math.sqrt(distSq)
      const f = (REPULSION / distSq) * alpha
      const fx = (dx / dist) * f
      const fy = (dy / dist) * f
      a.vx += fx; a.vy += fy
      b.vx -= fx; b.vy -= fy
    }
  }

  // 弹力
  for (const e of simEdges) {
    const { source: s, target: t } = e
    const dx = t.x - s.x, dy = t.y - s.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const f = (dist - REST_LENGTH) * SPRING_STRENGTH * alpha
    s.vx += (dx / dist) * f; s.vy += (dy / dist) * f
    t.vx -= (dx / dist) * f; t.vy -= (dy / dist) * f
  }

  // 重力 + 阻尼 + 更新位置
  for (const n of simNodes) {
    if (n.fixed) continue
    n.vx += (cx - n.x) * GRAVITY * alpha
    n.vy += (cy - n.y) * GRAVITY * alpha
    n.vx *= DAMPING
    n.vy *= DAMPING
    n.x += n.vx
    n.y += n.vy
  }
}

// ------- 渲染 -------

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ||
    getComputedStyle(document.documentElement).getPropertyValue('--vp-c-text-3').trim() ||
    '#888'
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.save()
  ctx.clearRect(0, 0, canvasW, canvasH)
  ctx.scale(dpr, dpr)
  ctx.translate(tx, ty)
  ctx.scale(scale, scale)

  const invScale = 1 / scale

  // 绘制边
  ctx.strokeStyle = 'rgba(150, 150, 150, 0.25)'
  ctx.lineWidth = invScale
  for (const e of simEdges) {
    ctx.beginPath()
    ctx.moveTo(e.source.x, e.source.y)
    ctx.lineTo(e.target.x, e.target.y)
    ctx.stroke()
  }

  // 绘制节点
  for (const n of simNodes) {
    const isHover = n === hoverNode
    const r = (isHover ? NODE_RADIUS_HOVER : NODE_RADIUS) * invScale
    ctx.beginPath()
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
    ctx.fillStyle = getCategoryColor(n.category)
    ctx.fill()
    if (isHover) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'
      ctx.lineWidth = 1.5 * invScale
      ctx.stroke()
    }
  }

  ctx.restore()
}

// ------- 主循环 -------

function loop() {
  if (alpha > ALPHA_MIN) {
    tick()
    alpha -= ALPHA_DECAY
  }
  draw()
  animFrame = requestAnimationFrame(loop)
}

function startLoop() {
  if (animFrame !== null) cancelAnimationFrame(animFrame)
  animFrame = requestAnimationFrame(loop)
}

// ------- 坐标转换 -------

function canvasToWorld(cx: number, cy: number) {
  return {
    x: (cx - tx) / scale,
    y: (cy - ty) / scale,
  }
}

function getNodeAt(cx: number, cy: number): SimNode | null {
  const { x, y } = canvasToWorld(cx, cy)
  const threshold = NODE_RADIUS_HOVER / scale * 1.5
  for (const n of simNodes) {
    const dx = n.x - x, dy = n.y - y
    if (Math.sqrt(dx * dx + dy * dy) < threshold) return n
  }
  return null
}

// ------- 交互事件 -------

function onWheel(e: WheelEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const factor = e.deltaY < 0 ? 1.12 : 0.89
  const newScale = Math.max(0.1, Math.min(5, scale * factor))
  tx = mx - (mx - tx) * (newScale / scale)
  ty = my - (my - ty) * (newScale / scale)
  scale = newScale
}

function onMouseDown(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const cx = e.clientX - rect.left
  const cy = e.clientY - rect.top
  const node = getNodeAt(cx, cy)
  if (node) {
    isDraggingNode = true
    dragNode = node
    node.fixed = true
    alpha = Math.max(alpha, 0.3)
  } else {
    isDraggingCanvas = true
    panStart = { x: e.clientX, y: e.clientY, tx, ty }
  }
}

function onMouseMove(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const cx = e.clientX - rect.left
  const cy = e.clientY - rect.top

  if (isDraggingNode && dragNode) {
    const { x, y } = canvasToWorld(cx, cy)
    dragNode.x = x
    dragNode.y = y
    dragNode.vx = 0
    dragNode.vy = 0
    canvas.style.cursor = 'grabbing'
  } else if (isDraggingCanvas) {
    tx = panStart.tx + (e.clientX - panStart.x)
    ty = panStart.ty + (e.clientY - panStart.y)
    canvas.style.cursor = 'grabbing'
  } else {
    const node = getNodeAt(cx, cy)
    hoverNode = node
    canvas.style.cursor = node ? 'pointer' : 'default'
    if (node) {
      tooltip.visible = true
      tooltip.x = cx + 12
      tooltip.y = cy - 10
      tooltip.text = node.title
    } else {
      tooltip.visible = false
    }
  }
}

function onMouseUp(e: MouseEvent) {
  if (isDraggingNode && dragNode) {
    dragNode.fixed = false
    dragNode = null
  }
  isDraggingNode = false
  isDraggingCanvas = false
  const canvas = canvasRef.value
  if (canvas) canvas.style.cursor = 'default'
}

function onMouseLeave() {
  isDraggingNode = false
  isDraggingCanvas = false
  hoverNode = null
  tooltip.visible = false
  if (dragNode) { dragNode.fixed = false; dragNode = null }
}

function onClick(e: MouseEvent) {
  if (isDraggingCanvas) return
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const node = getNodeAt(e.clientX - rect.left, e.clientY - rect.top)
  if (node) router.go(node.id)
}

// ------- 初始化 / 重置 -------

function resetView() {
  tx = 0; ty = 0; scale = 1
  alpha = 1.0
  initSimulation()
}

function resizeCanvas() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return
  dpr = window.devicePixelRatio || 1
  const w = container.clientWidth
  const h = container.clientHeight
  canvasW = w * dpr
  canvasH = h * dpr
  canvas.width = canvasW
  canvas.height = canvasH
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
}

// ------- 生命周期 -------

onMounted(() => {
  resizeCanvas()
  initSimulation()
  startLoop()
  window.addEventListener('resize', () => { resizeCanvas() })
})

onUnmounted(() => {
  if (animFrame !== null) cancelAnimationFrame(animFrame)
  window.removeEventListener('resize', resizeCanvas)
})
</script>
