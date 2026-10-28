import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  TreemapColorMode,
  TreemapNodeInput,
  TreemapRectNode
} from '../../../shared/types'
import { computeTreemapLayout } from '../../../shared/treemapLayout'

export interface InteractiveTreemapCanvasProps {
  nodes: TreemapNodeInput[]
  colorMode: TreemapColorMode
  selectedPath: string | null
  onSelectNode: (node: TreemapRectNode) => void
  onDrillDownFolder: (folderPath: string) => void
  onOpenInExplorer: (targetPath: string) => void
  onAddFileToCleanup?: (node: TreemapRectNode) => void
  formatBytes: (bytes: number) => string
}

export const InteractiveTreemapCanvas: React.FC<InteractiveTreemapCanvasProps> = ({
  nodes,
  colorMode,
  selectedPath,
  onSelectNode,
  onDrillDownFolder,
  onOpenInExplorer,
  onAddFileToCleanup,
  formatBytes
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 420
  })
  const [hoveredNode, setHoveredNode] = useState<TreemapRectNode | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    node: TreemapRectNode
  } | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateSize = (): void => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 20 && rect.height > 20) {
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height)
        })
      }
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const layoutRects = useMemo(() => {
    return computeTreemapLayout(nodes, {
      width: dimensions.width,
      height: dimensions.height,
      colorMode,
      maxVisibleBoxes: 85,
      minLabelWidth: 58,
      minLabelHeight: 26
    })
  }, [nodes, dimensions.width, dimensions.height, colorMode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, dimensions.width, dimensions.height)
    ctx.fillStyle = '#09090b'
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)

    for (const rect of layoutRects) {
      const pad = 1.5
      const rx = rect.x + pad
      const ry = rect.y + pad
      const rw = Math.max(0, rect.width - pad * 2)
      const rh = Math.max(0, rect.height - pad * 2)
      if (rw <= 0 || rh <= 0) continue

      const isSelected =
        selectedPath !== null &&
        rect.fullPath.toLowerCase() === selectedPath.toLowerCase() &&
        rect.kind !== 'aggregated_small'
      const isHovered = hoveredNode?.id === rect.id

      ctx.fillStyle = rect.colorHex
      ctx.globalAlpha = isHovered ? 0.96 : isSelected ? 0.92 : 0.82
      ctx.fillRect(rx, ry, rw, rh)

      // Üst parlaklık şeridi (derinlik hissi için)
      if (rh > 14 && rw > 14) {
        const grad = ctx.createLinearGradient(rx, ry, rx, ry + Math.min(rh, 40))
        grad.addColorStop(0, 'rgba(255,255,255,0.16)')
        grad.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = grad
        ctx.fillRect(rx, ry, rw, Math.min(rh, 40))
      }

      ctx.globalAlpha = 1
      ctx.lineWidth = isSelected ? 2.5 : isHovered ? 1.8 : 1
      ctx.strokeStyle = isSelected
        ? '#facc15'
        : isHovered
          ? '#f8fafc'
          : 'rgba(15, 23, 42, 0.85)'
      ctx.strokeRect(rx, ry, rw, rh)

      if (rect.showLabel) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(rx + 4, ry + 3, rw - 8, rh - 6)
        ctx.clip()

        ctx.fillStyle = '#ffffff'
        ctx.font = '600 11px Inter, system-ui, sans-serif'
        const prefix = rect.kind === 'folder' ? '📁 ' : rect.kind === 'aggregated_small' ? '📦 ' : ''
        ctx.fillText(`${prefix}${rect.name}`, rx + 6, ry + 15)

        if (rh >= 40) {
          ctx.fillStyle = 'rgba(241, 245, 249, 0.88)'
          ctx.font = '500 10px Inter, system-ui, sans-serif'
          const pct = (rect.byteRatio * 100).toFixed(1)
          ctx.fillText(`${formatBytes(rect.sizeBytes)} (%${pct})`, rx + 6, ry + 29)
        }

        ctx.restore()
      }
    }
  }, [layoutRects, dimensions, hoveredNode, selectedPath, formatBytes])

  const findNodeAt = (clientX: number, clientY: number): TreemapRectNode | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const bounds = canvas.getBoundingClientRect()
    const x = clientX - bounds.left
    const y = clientY - bounds.top

    for (let i = layoutRects.length - 1; i >= 0; i--) {
      const r = layoutRects[i]
      if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) {
        return r
      }
    }
    return null
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const bounds = canvas.getBoundingClientRect()
    setMousePos({ x: e.clientX - bounds.left, y: e.clientY - bounds.top })
    const hit = findNodeAt(e.clientX, e.clientY)
    setHoveredNode(hit)
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    setContextMenu(null)
    const hit = findNodeAt(e.clientX, e.clientY)
    if (hit) {
      onSelectNode(hit)
    }
  }

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    setContextMenu(null)
    const hit = findNodeAt(e.clientX, e.clientY)
    if (!hit) return
    if (hit.kind === 'folder') {
      onDrillDownFolder(hit.fullPath)
    } else if (hit.kind === 'file') {
      onOpenInExplorer(hit.fullPath)
    }
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    e.preventDefault()
    const hit = findNodeAt(e.clientX, e.clientY)
    if (!hit || !containerRef.current) {
      setContextMenu(null)
      return
    }
    onSelectNode(hit)
    const bounds = containerRef.current.getBoundingClientRect()
    setContextMenu({
      x: Math.min(bounds.width - 220, Math.max(8, e.clientX - bounds.left)),
      y: Math.min(bounds.height - 150, Math.max(8, e.clientY - bounds.top)),
      node: hit
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (layoutRects.length === 0) return
    const currentIndex = layoutRects.findIndex(
      (r) => selectedPath && r.fullPath.toLowerCase() === selectedPath.toLowerCase()
    )

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = layoutRects[(currentIndex + 1) % layoutRects.length]
      if (next) onSelectNode(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev =
        layoutRects[(currentIndex - 1 + layoutRects.length) % layoutRects.length]
      if (prev) onSelectNode(prev)
    } else if (e.key === 'Enter' && currentIndex >= 0) {
      e.preventDefault()
      const target = layoutRects[currentIndex]
      if (target.kind === 'folder') {
        onDrillDownFolder(target.fullPath)
      }
    }
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setContextMenu(null)}
      className="relative w-full h-full min-h-[340px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {layoutRects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs p-6 text-center">
          <span>Bu klasörde boyut kaplayan dosya veya alt klasör bulunmuyor (0 B).</span>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          style={{ width: dimensions.width, height: dimensions.height }}
          className="block cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredNode(null)}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
        />
      )}

      {/* Üzerine Gelindiğinde (Hover) Zengin Araç İpucu (Tooltip) */}
      {hoveredNode && !contextMenu && (
        <div
          style={{
            left: Math.min(dimensions.width - 290, Math.max(10, mousePos.x + 14)),
            top: Math.min(dimensions.height - 135, Math.max(10, mousePos.y + 14))
          }}
          className="pointer-events-none absolute z-30 w-72 rounded-lg bg-slate-900/95 border border-slate-700 p-2.5 shadow-xl text-xs text-slate-100"
        >
          <div className="font-semibold text-white truncate flex items-center space-x-1.5">
            <span>
              {hoveredNode.kind === 'folder'
                ? '📁'
                : hoveredNode.kind === 'aggregated_small'
                  ? '📦'
                  : '📄'}
            </span>
            <span className="truncate">{hoveredNode.name}</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            {hoveredNode.fullPath}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400">Boyut: </span>
              <span className="font-bold text-blue-400">
                {formatBytes(hoveredNode.sizeBytes)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Pay: </span>
              <span className="font-semibold text-emerald-400">
                %{(hoveredNode.byteRatio * 100).toFixed(1)}
              </span>
            </div>
            {hoveredNode.kind !== 'file' && (
              <>
                <div>
                  <span className="text-slate-400">Dosya: </span>
                  <span className="font-medium text-slate-200">
                    {hoveredNode.fileCount.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Alt Klasör: </span>
                  <span className="font-medium text-slate-200">
                    {hoveredNode.folderCount.toLocaleString('tr-TR')}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="mt-1.5 text-[10px] text-amber-300/90">
            {hoveredNode.kind === 'folder'
              ? 'Çift tıklayarak klasörün içine girebilirsiniz.'
              : hoveredNode.kind === 'file'
                ? 'Tıklayarak ayrıntıları görün; çift tıklayarak Gezgin’de açın.'
                : 'Küçük boyutlu öğelerin birleştirilmiş özeti.'}
          </div>
        </div>
      )}

      {/* Sağ Tık Bağlam Menüsü (Context Menu) */}
      {contextMenu && (
        <div
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-40 w-56 rounded-lg bg-slate-900 border border-slate-700 shadow-2xl py-1 text-xs text-slate-200"
        >
          <div className="px-3 py-1.5 border-b border-slate-800 font-semibold text-white truncate">
            {contextMenu.node.name}
          </div>
          {contextMenu.node.kind === 'folder' && (
            <button
              type="button"
              onClick={() => {
                onDrillDownFolder(contextMenu.node.fullPath)
                setContextMenu(null)
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors"
            >
              📂 Klasörün İçine Gir (Haritayı Aç)
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onOpenInExplorer(contextMenu.node.fullPath)
              setContextMenu(null)
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 transition-colors"
          >
            🧭 Windows Gezgini’nde Göster
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(contextMenu.node.fullPath)
              setContextMenu(null)
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 transition-colors"
          >
            📋 Tam Yolu Kopyala
          </button>
          {contextMenu.node.kind === 'file' && onAddFileToCleanup && (
            <button
              type="button"
              onClick={() => {
                onAddFileToCleanup(contextMenu.node)
                setContextMenu(null)
              }}
              className="w-full text-left px-3 py-1.5 text-amber-400 hover:bg-slate-800 transition-colors border-t border-slate-800"
            >
              🗑️ Güvenli Temizlik Listesine Ekle
            </button>
          )}
        </div>
      )}
    </div>
  )
}

