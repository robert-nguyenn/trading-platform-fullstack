import type React from "react"
export default function CopilotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
