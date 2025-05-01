"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface GameLogProps {
  log: string[]
}

export default function GameLog({ log = [] }: GameLogProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when log updates
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [log])

  return (
    <div ref={scrollAreaRef}>
      <ScrollArea className="h-[300px] rounded-md border p-2">
        <div className="space-y-1">
          {(log || []).map((entry, index) => (
            <div
              key={index}
              className={`py-1 px-2 text-sm rounded ${
                entry.includes("wins")
                  ? "bg-green-100 font-bold"
                  : entry.includes("defeated")
                    ? "bg-red-50"
                    : entry.includes("Turn")
                      ? "bg-blue-50 font-semibold"
                      : ""
              }`}
            >
              {entry}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
