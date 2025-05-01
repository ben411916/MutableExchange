"use client"

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
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#fbf3de] border-2 border-black">
        <DialogHeader>
          <DialogTitle className="font-mono">GAME CONTROLS</DialogTitle>
          <DialogDescription>How to play the PvP shooter</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-1">Movement</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>W, A, S, D - Move your character</li>
              <li>SHIFT - Dash (cooldown: 2 seconds)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-1">Combat</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mouse - Aim</li>
              <li>Left Click / SPACE - Shoot</li>
              <li>Right Click - Alternative Dash</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-1">Objective</h3>
            <p>Eliminate other players to earn points. Last player standing wins the match and the MUTB token pot!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
