"use client"

import { useEffect, useRef } from "react"

interface TickerItem {
  name: string
  value: string
  change: string
  sparkline: number[]
}

interface TickerProps {
  items: TickerItem[]
}

export function EnhancedTicker({ items }: TickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Render mini sparkline chart
  const renderSparkline = (
    ctx: CanvasRenderingContext2D,
    data: number[],
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
  ) => {
    if (!data || data.length < 2) return

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min

    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5

    data.forEach((value, index) => {
      const pointX = x + (index * width) / (data.length - 1)
      const pointY = y + height - ((value - min) / range) * height

      if (index === 0) {
        ctx.moveTo(pointX, pointY)
      } else {
        ctx.lineTo(pointX, pointY)
      }
    })

    ctx.stroke()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let offset = 0

    const draw = () => {
      if (!ctx || !canvas) return

      // Set canvas dimensions
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

      // Clear canvas
      ctx.fillStyle = "#000"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw scan lines
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)"
      for (let i = 0; i < canvas.height; i += 4) {
        ctx.fillRect(0, i, canvas.width, 1)
      }

      // Calculate item width
      const itemWidth = 200
      const totalWidth = items.length * itemWidth

      // Update offset for scrolling
      offset = (offset + 0.5) % totalWidth

      // Draw ticker items
      const doubledItems = [...items, ...items]
      doubledItems.forEach((item, index) => {
        const x = index * itemWidth - offset

        // Only draw visible items
        if (x < -itemWidth || x > canvas.offsetWidth) return

        // Draw separator
        ctx.fillStyle = "#222"
        ctx.fillRect(x + itemWidth - 1, 0, 1, canvas.offsetHeight)

        // Draw text
        ctx.font = "10px monospace"
        ctx.fillStyle = "#aaa"
        ctx.fillText(item.name, x + 10, 20)

        ctx.font = "bold 10px monospace"
        ctx.fillStyle = "#fff"
        ctx.fillText(item.value, x + 10 + ctx.measureText(item.name).width + 10, 20)

        const isPositive = item.change.startsWith("+")
        ctx.fillStyle = isPositive ? "#22c55e" : "#ef4444"
        ctx.fillText(
          item.change,
          x + 10 + ctx.measureText(item.name).width + ctx.measureText(item.value).width + 20,
          20,
        )

        // Draw sparkline
        renderSparkline(
          ctx,
          item.sparkline,
          x +
            10 +
            ctx.measureText(item.name).width +
            ctx.measureText(item.value).width +
            ctx.measureText(item.change).width +
            30,
          10,
          60,
          16,
          isPositive ? "#22c55e" : "#ef4444",
        )
      })

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [items])

  return <canvas ref={canvasRef} className="w-full h-8 block" />
}
