"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Wallet, Gamepad2, ArrowLeftRight } from "lucide-react"
import Image from "next/image"
import MutableMarketplace from "./mutable-marketplace"
import GameSelection from "./pvp-game/game-selection"
import MatchmakingLobby from "./pvp-game/matchmaking-lobby"
import type { Connection } from "@solana/web3.js"
import SoundButton from "./sound-button"
import { withClickSound } from "@/utils/sound-utils"

interface MutablePlatformProps {
  publicKey: string
  balance: number | null
  provider: any
  connection: Connection
}

export default function MutablePlatform({ publicKey, balance, provider, connection }: MutablePlatformProps) {
  const [activeTab, setActiveTab] = useState("games")
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [mutbBalance, setMutbBalance] = useState<number>(100) // Mock MUTB balance

  const handleSelectGame = (gameId: string) => {
    setSelectedGame(gameId)
  }

  const handleBackToSelection = () => {
    setSelectedGame(null)
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="games" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 border-2 border-black bg-[#FFD54F]">
          <TabsTrigger
            value="exchange"
            className="data-[state=active]:bg-white data-[state=active]:text-black font-mono"
            onClick={withClickSound()}
          >
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              <span>EXCHANGE</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="games"
            className="data-[state=active]:bg-white data-[state=active]:text-black font-mono"
            onClick={withClickSound()}
          >
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              <span>GAMES</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="wallet"
            className="data-[state=active]:bg-white data-[state=active]:text-black font-mono"
            onClick={withClickSound()}
          >
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span>WALLET</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exchange">
          <MutableMarketplace publicKey={publicKey} balance={balance} provider={provider} connection={connection} />
        </TabsContent>

        <TabsContent value="games">
          {selectedGame ? (
            <div className="space-y-4">
              <div className="flex items-center">
                <SoundButton
                  variant="outline"
                  className="border-2 border-black text-black hover:bg-[#FFD54F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  onClick={handleBackToSelection}
                >
                  Back to Game Selection
                </SoundButton>
                <Badge
                  variant="outline"
                  className="ml-auto bg-[#FFD54F] text-black border-2 border-black flex items-center gap-1 font-mono"
                >
                  <Image src="/images/mutable-token.png" alt="MUTB" width={16} height={16} className="rounded-full" />
                  {mutbBalance.toFixed(2)} MUTB
                </Badge>
              </div>
              <MatchmakingLobby publicKey={publicKey} balance={balance} mutbBalance={mutbBalance} />
            </div>
          ) : (
            <GameSelection
              publicKey={publicKey}
              balance={balance}
              mutbBalance={mutbBalance}
              onSelectGame={handleSelectGame}
            />
          )}
        </TabsContent>

        <TabsContent value="wallet">
          <Card className="bg-[#fbf3de] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  <CardTitle className="font-mono">WALLET</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="bg-[#FFD54F] text-black border-2 border-black flex items-center gap-1 font-mono"
                >
                  <Image src="/images/mutable-token.png" alt="MUTB" width={16} height={16} className="rounded-full" />
                  {mutbBalance.toFixed(2)} MUTB
                </Badge>
              </div>
              <CardDescription>Manage your wallet and tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border-2 border-black rounded-md bg-[#f5efdc]">
                  <div className="font-bold mb-2 font-mono">CONNECTED WALLET</div>
                  <div className="text-sm font-mono truncate">{publicKey}</div>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">SOL Balance:</span> {balance !== null ? balance : "Loading..."}
                  </div>
                </div>

                <div className="p-4 border-2 border-black rounded-md bg-[#f5efdc]">
                  <div className="font-bold mb-2 font-mono">MUTABLE TOKENS</div>
                  <div className="flex items-center gap-2">
                    <Image src="/images/mutable-token.png" alt="MUTB" width={24} height={24} className="rounded-full" />
                    <div>
                      <div className="font-medium font-mono">MUTB</div>
                      <div className="text-sm text-muted-foreground">Mutable Protocol Token</div>
                    </div>
                    <div className="ml-auto font-mono">{mutbBalance.toFixed(2)}</div>
                  </div>
                </div>

                <div className="p-4 border-2 border-black rounded-md bg-[#f5efdc]">
                  <div className="font-bold mb-2 font-mono">GAME TOKENS</div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Image
                        src="/images/mutable-logo-transparent.png"
                        alt="GOLD"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <div>
                        <div className="font-medium font-mono">GOLD</div>
                        <div className="text-sm text-muted-foreground">Fantasy RPG</div>
                      </div>
                      <div className="ml-auto font-mono">1,250</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image
                        src="/images/mutable-logo-transparent.png"
                        alt="GEMS"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <div>
                        <div className="font-medium font-mono">GEMS</div>
                        <div className="text-sm text-muted-foreground">Space Explorer</div>
                      </div>
                      <div className="ml-auto font-mono">350</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image
                        src="/images/mutable-logo-transparent.png"
                        alt="COINS"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <div>
                        <div className="font-medium font-mono">COINS</div>
                        <div className="text-sm text-muted-foreground">Crypto Racer</div>
                      </div>
                      <div className="ml-auto font-mono">500</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <SoundButton
                className="w-full bg-[#FFD54F] hover:bg-[#FFCA28] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono"
                onClick={() => setActiveTab("exchange")}
              >
                GO TO EXCHANGE
              </SoundButton>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
