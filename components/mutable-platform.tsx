"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gamepad2, ArrowRightCircle, Coins } from "lucide-react"
import MutableMarketplace from "./mutable-marketplace"
import type { Connection } from "@solana/web3.js"

interface MutablePlatformProps {
  publicKey: string
  balance: number | null
  provider: any
  connection: Connection
}

export default function MutablePlatform({ publicKey, balance, provider, connection }: MutablePlatformProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<"none" | "exchange" | "pvp">("none")

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      {selectedPlatform === "none" && (
        <div className="space-y-6">
          <div className="flex justify-center mb-6">
            <Image src="/images/mutable-logo.png" alt="Mutable Logo" width={200} height={200} className="mb-2" />
          </div>

          <Card className="bg-[#FFF8E1] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-center mb-6 font-mono">SELECT PLATFORM</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setSelectedPlatform("exchange")}
                  className="h-auto py-6 px-4 bg-[#FFD54F] hover:bg-[#FFCA28] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Coins size={32} />
                    <span className="text-xl font-bold font-mono">MUTABLE EXCHANGE</span>
                    <span className="text-sm">Trade gaming currencies</span>
                  </div>
                </Button>

                <Button
                  onClick={() => setSelectedPlatform("pvp")}
                  className="h-auto py-6 px-4 bg-[#FFD54F] hover:bg-[#FFCA28] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Gamepad2 size={32} />
                    <span className="text-xl font-bold font-mono">MUTABLE PVP</span>
                    <span className="text-sm">Player vs Player betting</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Exchange Platform */}
      {selectedPlatform === "exchange" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setSelectedPlatform("none")}
              variant="outline"
              className="border-2 border-black text-black hover:bg-[#FFD54F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              Back to Selection
            </Button>
            <div className="flex items-center gap-2">
              <Image src="/images/mutable-token.png" alt="MUTB Token" width={32} height={32} />
              <span className="font-bold font-mono">MUTABLE EXCHANGE</span>
            </div>
          </div>
          <MutableMarketplace publicKey={publicKey} balance={balance} provider={provider} connection={connection} />
        </div>
      )}

      {/* PvP Platform - Coming Soon */}
      {selectedPlatform === "pvp" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setSelectedPlatform("none")}
              variant="outline"
              className="border-2 border-black text-black hover:bg-[#FFD54F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              Back to Selection
            </Button>
            <div className="flex items-center gap-2">
              <Image src="/images/mutable-token.png" alt="MUTB Token" width={32} height={32} />
              <span className="font-bold font-mono">MUTABLE PVP</span>
            </div>
          </div>

          <Card className="bg-[#FFF8E1] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardContent className="p-12 flex flex-col items-center justify-center">
              <Gamepad2 size={64} className="mb-4 text-gray-700" />
              <h2 className="text-3xl font-bold font-mono text-center mb-2">COMING SOON</h2>
              <p className="text-center text-gray-700 max-w-md">
                Player vs Player betting will allow you to wager MUTB tokens on your gaming skills. Challenge other
                players and win big!
              </p>

              <div className="mt-8 flex items-center gap-2 bg-[#FFD54F] px-4 py-2 rounded-md border-2 border-black">
                <ArrowRightCircle size={20} />
                <span className="font-medium">Join our waitlist for early access</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
