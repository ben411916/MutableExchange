"use client"

import { useState } from "react"
import { AlertCircle } from "lucide-react"

export default function DemoWatermark() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="fixed top-2 right-2 z-50 flex items-center gap-1.5 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm transition-all duration-200 cursor-pointer max-w-[120px] sm:max-w-[150px]"
      style={{ maxWidth: expanded ? "300px" : undefined }}
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
      <div className="overflow-hidden">
        <p className="whitespace-nowrap text-[10px] sm:text-xs">
          {expanded ? "This is a demo application. No real transactions will be processed." : "Demo Purposes Only"}
        </p>
      </div>
    </div>
  )
}
