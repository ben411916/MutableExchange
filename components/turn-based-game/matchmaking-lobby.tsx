"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"
import Image from "next/image"
import { UNITS } from "./units"

// Import GameController with dynamic import
import dynamic from "next/dynamic"

// Use dynamic import with no SSR for the GameController
const GameController = dynamic(() => import("./game-controller"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
      <p>Loading game...</p>
    </div>
  ),
})

interface MatchmakingLobbyProps {
  publicKey: string
  playerName: string
  mutbBalance: number
  onExit: () => void
}

interface GameLobby {
  id: string
  host: string
  hostName: string
  wager: number
  players: number
  maxPlayers: number
  status: "waiting" | "full" | "in-progress"
}

export default function MatchmakingLobby({ publicKey, playerName, mutbBalance, onExit }: MatchmakingLobbyProps) {
  const [activeTab, setActiveTab] = useState("browse")
  const [wagerAmount, setWagerAmount] = useState<number>(1)
  const [inGame, setInGame] = useState(false)
  const [selectedLobby, setSelectedLobby] = useState<GameLobby | null>(null)
  const [gameResult, setGameResult] = useState<{ winner: string; reward: number } | null>(null)

  // Mock lobbies
  const [lobbies, setLobbies] = useState<GameLobby[]>([
    {
      id: "lobby-1",
      host: "Player1",
      hostName: "CryptoGamer",
      wager: 5,
      players: 1,
      maxPlayers: 2,
      status: "waiting",
    },
    {
      id: "lobby-2",
      host: "Player2",
      hostName: "SolanaWarrior",
      wager: 10,
      players: 1,
      maxPlayers: 2,
      status: "waiting",
    },
    {
      id: "lobby-3",
      host: "Player3",
      hostName: "MUTBChampion",
      wager: 20,
      players: 2,
      maxPlayers: 2,
      status: "full",
    },
  ])

  const createLobby = () => {
    if (wagerAmount > mutbBalance) {
      alert("You don't have enough MUTB tokens for this wager")
      return
    }

    const newLobby: GameLobby = {
      id: `lobby-${Date.now()}`,
      host: publicKey,
      hostName: playerName,
      wager: wagerAmount,
      players: 1,
      maxPlayers: 2,
      status: "waiting",
    }

    setLobbies([...lobbies, newLobby])
    setSelectedLobby(newLobby)
    setInGame(true)
  }

  const joinLobby = (lobby: GameLobby) => {
    if (lobby.status !== "waiting") return
    if (lobby.wager > mutbBalance) {
      alert("You don't have enough MUTB tokens for this wager")
      return
    }

    setSelectedLobby(lobby)
    setInGame(true)
  }

  const handleGameEnd = (winner: string) => {
    if (!selectedLobby) return

    // Calculate rewards
    const winnerReward = selectedLobby.wager * 2 * 0.95 // 5% platform fee

    setGameResult({
      winner,
      reward: winner === publicKey ? winnerReward : 0,
    })
  }

  const exitGame = () => {
    setInGame(false)
    setSelectedLobby(null)
    setGameResult(null)
    if (onExit) {
      onExit()
    }
  }

  if (inGame) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            className="border-2 border-black text-black hover:bg-[#FFD54F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            onClick={exitGame}
          >
            Exit Game
          </Button>
          <Badge variant="outline" className="bg-[#FFD54F] text-black border-2 border-black font-mono">
            WAGER: {selectedLobby?.wager} MUTB
          </Badge>
        </div>

        {gameResult ? (
          <Card className="bg-[#fbf3de] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle className="text-center font-mono">GAME OVER</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {gameResult.winner === publicKey ? (
                <>
                  <div className="text-4xl font-bold font-mono text-green-600">YOU WIN!</div>
                  <div className="flex items-center justify-center gap-2 text-2xl">
                    <Image src="/images/mutable-token.png" alt="MUTB" width={32} height={32} />
                    <span className="font-mono">+{gameResult.reward} MUTB</span>
                  </div>
                </>
              ) : (
                <div className="text-4xl font-bold font-mono text-red-600">YOU LOSE!</div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-[#FFD54F] hover:bg-[#FFCA28] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono"
                onClick={exitGame}
              >
                RETURN TO LOBBY
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <GameController
            playerId={publicKey}
            playerName={playerName}
            opponentId={selectedLobby?.host === publicKey ? "opponent" : selectedLobby?.host || "opponent"}
            opponentName={selectedLobby?.host === publicKey ? "Opponent" : selectedLobby?.hostName || "Opponent"}
            wagerAmount={selectedLobby?.wager || 0}
            onGameEnd={handleGameEnd}
          />
        )}
      </div>
    )
  }

  return (
    <Card className="bg-[#fbf3de] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <CardTitle className="font-mono">TURN-BASED STRATEGY</CardTitle>
          </div>
          <Badge
            variant="outline"
            className="bg-[#FFD54F] text-black border-2 border-black flex items-center gap-1 font-mono"
          >
            <Image src="/images/mutable-token.png" alt="MUTB" width={16} height={16} className="rounded-full" />
            {mutbBalance.toFixed(2)} MUTB
          </Badge>
        </div>
        <CardDescription>Battle other players in turn-based strategy and win MUTB tokens</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="browse" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 border-2 border-black bg-[#FFD54F]">
            <TabsTrigger
              value="browse"
              className="data-[state=active]:bg-white data-[state=active]:text-black font-mono"
            >
              BROWSE GAMES
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-white data-[state=active]:text-black font-mono"
            >
              CREATE GAME
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            {lobbies.length > 0 ? (
              <div className="space-y-3">
                {lobbies.map((lobby) => (
                  <div
                    key={lobby.id}
                    className="flex items-center justify-between p-3 border-2 border-black rounded-md bg-[#f5efdc] hover:bg-[#f0e9d2] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-[#FFD54F] p-2 rounded-md border-2 border-black">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold font-mono">Turn-Based Strategy</div>
                        <div className="text-sm text-muted-foreground">Host: {lobby.hostName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium">Players</div>
                        <div className="font-mono">
                          {lobby.players}/{lobby.maxPlayers}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">Wager</div>
                        <div className="font-mono flex items-center justify-center gap-1">
                          <Image src="/images/mutable-token.png" alt="MUTB" width={12} height={12} />
                          {lobby.wager}
                        </div>
                      </div>
                      <Button
                        className="bg-[#FFD54F] hover:bg-[#FFCA28] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono"
                        disabled={lobby.status !== "waiting" || lobby.host === publicKey}
                        onClick={() => joinLobby(lobby)}
                      >
                        {lobby.status === "full" || lobby.status === "in-progress"
                          ? "FULL"
                          : lobby.host === publicKey
                            ? "YOUR GAME"
                            : "JOIN"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="font-mono">NO ACTIVE GAMES</p>
                <p className="text-sm mt-2">Create a new game to start playing</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="wagerAmount" className="font-mono">
                  WAGER AMOUNT (MUTB)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="wagerAmount"
                    type="number"
                    min={1}
                    max={mutbBalance}
                    value={wagerAmount}
                    onChange={(e) => setWagerAmount(Number(e.target.value))}
                    className="border-2 border-black"
                  />
                  <div className="flex items-center gap-1 bg-[#f5efdc] px-3 py-2 rounded-md border-2 border-black">
                    <Image src="/images/mutable-token.png" alt="MUTB" width={16} height={16} />
                    <span className="font-mono">MUTB</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Your balance: {mutbBalance.toFixed(2)} MUTB</p>
              </div>

              <div className="space-y-2">
                <Label className="font-mono">GAME PREVIEW</Label>
                <div className="border-2 border-black rounded-md p-4 bg-[#f5efdc]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {UNITS.slice(0, 6).map((unit) => (
                      <div key={unit.id} className="border border-gray-300 rounded-md p-2 bg-white text-center">
                        <div className="relative w-full h-12 mb-1">
                          <Image
                            src={unit.sprite || "/placeholder.svg"}
                            alt={unit.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div className="text-xs font-semibold truncate">{unit.name}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-center mt-3">
                    Command your units in turn-based tactical combat. Defeat your opponent to win the wager!
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        {activeTab === "create" ? (
          <Button
            className="w-full bg-[#FFD54F] hover:bg-[#FFCA28] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono"
            disabled={wagerAmount <= 0 || wagerAmount > mutbBalance}
            onClick={createLobby}
          >
            CREATE GAME
          </Button>
        ) : (
          <Button
            className="w-full bg-[#FFD54F] hover:bg-[#FFCA28] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono"
            onClick={() => setActiveTab("create")}
          >
            CREATE NEW GAME
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
