"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"

export default function GameInstructions() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-2 border-black text-black hover:bg-[#FFD54F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-2 border-black bg-[#fbf3de]">
        <DialogHeader>
          <DialogTitle className="font-mono">GAME INSTRUCTIONS</DialogTitle>
          <DialogDescription>How to play the top-down shooter game</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-1">Controls</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Move with WASD or arrow keys</li>
              <li>Aim with mouse</li>
              <li>Left-click to shoot</li>
              <li>Right-click to use special ability</li>
              <li>Space to dash</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-1">Game Modes</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <span className="font-medium">1v1 Duel:</span> First to 10 kills or highest score after 2 minutes wins
              </li>
              <li>
                <span className="font-medium">Free-For-All:</span> Every player for themselves, highest score after 2
                minutes wins
              </li>
              <li>
                <span className="font-medium">Timed Match:</span> Score as many kills as possible within 2 minutes
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-1">Power-ups</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <span className="font-medium">Shield:</span> Temporary invulnerability
              </li>
              <li>
                <span className="font-medium">Speed Boost:</span> Move faster for a short time
              </li>
              <li>
                <span className="font-medium">Rapid Fire:</span> Shoot faster for a short time
              </li>
              <li>
                <span className="font-medium">Health Pack:</span> Restore health
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-1">Rewards</h3>
            <p className="text-sm">
              Winners receive 95% of the total wager pool. 5% goes to the Mutable platform as a fee.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
