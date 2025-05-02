"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { gameTokens } from "@/data/game-tokens"
import type { GameToken, TradeOrder, FeeDistribution } from "@/types/mutable"
import { Repeat, ArrowRight, Info, Check, AlertCircle, History, Coins } from "lucide-react"
import Image from "next/image"
import { type Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import SoundButton from "./sound-button"
import { withClickSound } from "@/utils/sound-utils"

// Mock MUTB token address (this would be the actual token address in production)
const MUTB_TOKEN_ADDRESS = "4EeyZSGjkiM4bBhMPWriyaR9mqdFBGtYKcYCAzTivQbW"

interface MutableMarketplaceProps {
  publicKey: string
  balance: number | null
  provider: any
  connection: Connection
}

export default function MutableMarketplace({ publicKey, balance, provider, connection }: MutableMarketplaceProps) {
  const [sourceToken, setSourceToken] = useState<GameToken | null>(null)
  const [destinationToken, setDestinationToken] = useState<GameToken | null>(null)
  const [sourceAmount, setSourceAmount] = useState<string>("")
  const [destinationAmount, setDestinationAmount] = useState<string>("")
  const [mutbBalance, setMutbBalance] = useState<number>(10) // Mock MUTB balance
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tradeStatus, setTradeStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [tradeHistory, setTradeHistory] = useState<TradeOrder[]>([])
  const [activeTab, setActiveTab] = useState("exchange")

  // Fee distribution according to the whitepaper
  const feeDistribution: FeeDistribution = {
    sourceGame: 30, // 30% to source game
    destinationGame: 30, // 30% to destination game
    stakers: 40, // 40% to stakers
  }

  // Calculate the MUTB fee (0.5% of the transaction value)
  const calculateMutbFee = (amount: number): number => {
    return amount * 0.005
  }

  // Handle source token selection
  const handleSourceTokenChange = (tokenId: string) => {
    const token = gameTokens.find((t) => t.id === tokenId) || null
    setSourceToken(token)

    // Reset destination token if it's the same as source
    if (destinationToken && destinationToken.id === tokenId) {
      setDestinationToken(null)
      setDestinationAmount("")
    }

    // Recalculate destination amount if both tokens are selected
    if (token && destinationToken && sourceAmount) {
      const srcAmount = Number.parseFloat(sourceAmount)
      const mutbValue = srcAmount / token.conversionRate
      const destAmount = mutbValue * destinationToken.conversionRate
      setDestinationAmount(destAmount.toFixed(2))
    } else {
      setDestinationAmount("")
    }
  }

  // Handle destination token selection
  const handleDestinationTokenChange = (tokenId: string) => {
    const token = gameTokens.find((t) => t.id === tokenId) || null
    setDestinationToken(token)

    // Reset source token if it's the same as destination
    if (sourceToken && sourceToken.id === tokenId) {
      setSourceToken(null)
      setSourceAmount("")
    }

    // Recalculate destination amount if both tokens are selected
    if (sourceToken && token && sourceAmount) {
      const srcAmount = Number.parseFloat(sourceAmount)
      const mutbValue = srcAmount / sourceToken.conversionRate
      const destAmount = mutbValue * token.conversionRate
      setDestinationAmount(destAmount.toFixed(2))
    } else {
      setDestinationAmount("")
    }
  }

  // Handle source amount change
  const handleSourceAmountChange = (value: string) => {
    setSourceAmount(value)

    // Calculate destination amount based on conversion rates
    if (sourceToken && destinationToken && value) {
      const srcAmount = Number.parseFloat(value)
      const mutbValue = srcAmount / sourceToken.conversionRate
      const destAmount = mutbValue * destinationToken.conversionRate
      setDestinationAmount(destAmount.toFixed(2))
    } else {
      setDestinationAmount("")
    }
  }

  // Swap source and destination tokens
  const handleSwapTokens = () => {
    if (sourceToken && destinationToken) {
      const tempToken = sourceToken
      const tempAmount = sourceAmount

      setSourceToken(destinationToken)
      setSourceAmount(destinationAmount)

      setDestinationToken(tempToken)
      setDestinationAmount(tempAmount)
    }
  }

  // Execute the trade
  const executeTrade = async () => {
    if (!sourceToken || !destinationToken || !sourceAmount || !publicKey || !provider) {
      return
    }

    try {
      setTradeStatus("processing")
      setStatusMessage("Processing your trade...")

      const srcAmount = Number.parseFloat(sourceAmount)
      const destAmount = Number.parseFloat(destinationAmount)

      // Calculate MUTB value and fee
      const mutbValue = srcAmount / sourceToken.conversionRate
      const mutbFee = calculateMutbFee(mutbValue)

      // In a real implementation, this would be a token transfer
      // For this POC, we'll simulate the transaction

      // Create a new transaction (this is a simplified example)
      const transaction = new Transaction()

      // Add a transfer instruction to the transaction
      // In reality, this would be a token transfer instruction
      const senderPublicKey = new PublicKey(publicKey)

      // This would be the Mutable protocol contract address in production
      const protocolAddress = new PublicKey(MUTB_TOKEN_ADDRESS)

      // Simulate a transaction with a small SOL transfer to represent the trade
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: senderPublicKey,
          toPubkey: protocolAddress,
          lamports: 100000, // A small amount for demonstration
        }),
      )

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = senderPublicKey

      setStatusMessage("Signing transaction...")

      // Sign the transaction
      const signedTransaction = await provider.signTransaction(transaction)

      setStatusMessage("Sending transaction...")

      // Send the transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())

      setStatusMessage("Confirming transaction...")

      // Confirm the transaction
      await connection.confirmTransaction(signature, "confirmed")

      // Create a trade record
      const tradeOrder: TradeOrder = {
        id: `trade-${Date.now()}`,
        sourceToken,
        destinationToken,
        sourceAmount: srcAmount,
        destinationAmount: destAmount,
        mutbFee,
        status: "completed",
        timestamp: Date.now(),
        txSignature: signature,
      }

      // Add to trade history
      setTradeHistory((prev) => [tradeOrder, ...prev])

      // Update MUTB balance (in a real app, this would be fetched from the blockchain)
      setMutbBalance((prev) => prev - mutbFee)

      setTradeStatus("success")
      setStatusMessage(
        `Successfully traded ${srcAmount} ${sourceToken.symbol} for ${destAmount.toFixed(2)} ${destinationToken.symbol}!`,
      )

      // Close dialog after 2 seconds on success
      setTimeout(() => {
        setIsDialogOpen(false)
        setTradeStatus("idle")

        // Reset form
        setSourceAmount("")
        setDestinationAmount("")
      }, 2000)
    } catch (error) {
      console.error("Trade error:", error)
      setTradeStatus("error")
      setStatusMessage(error instanceof Error ? error.message : "Transaction failed")
    }
  }

  // Initiate trade
  const handleTrade = () => {
    if (!sourceToken || !destinationToken || !sourceAmount) {
      return
    }

    setIsDialogOpen(true)
    setTradeStatus("idle")
    setStatusMessage("")
  }

  return (
    <Card className="bg-[#fbf3de] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            <CardTitle className="font-mono">CURRENCY EXCHANGE</CardTitle>
          </div>
          <Badge
            variant="outline"
            className="bg-[#FFD54F] text-black border-2 border-black flex items-center gap-1 font-mono"
          >
            <Image src="/images/mutable-token.png" alt="MUTB" width={16} height={16} className="rounded-full" />
            {mutbBalance.toFixed(2)} MUTB
          </Badge>
        </div>
        <CardDescription>Trade gaming currencies across different games using the Mutable protocol</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="exchange" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 border-2 border-black bg-[#FFD54F]">
            <TabsTrigger
              value="exchange"
              className="data-[state=active]:bg-white data-[state=active]:text-black font-mono"
              onClick={withClickSound()}
            >
              EXCHANGE
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-white data-[state=active]:text-black font-mono"
              onClick={withClickSound()}
            >
              HISTORY
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exchange" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Source Token */}
              <div className="space-y-2">
                <Label htmlFor="sourceToken" className="font-mono">
                  FROM
                </Label>
                <Select value={sourceToken?.id || ""} onValueChange={handleSourceTokenChange}>
                  <SelectTrigger id="sourceToken" className="border-2 border-black" onClick={withClickSound()}>
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black">
                    {gameTokens.map((token) => (
                      <SelectItem
                        key={`source-${token.id}`}
                        value={token.id}
                        disabled={token.id === destinationToken?.id}
                      >
                        <div className="flex items-center gap-2">
                          <Image src={token.icon || "/placeholder.svg"} alt={token.name} width={20} height={20} />
                          <span>{token.name}</span>
                          <span className="text-muted-foreground text-xs">({token.gameName})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="sourceAmount" className="font-mono">
                  AMOUNT
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="sourceAmount"
                    type="number"
                    placeholder="0.00"
                    value={sourceAmount}
                    onChange={(e) => handleSourceAmountChange(e.target.value)}
                    disabled={!sourceToken}
                    className="border-2 border-black"
                  />
                  <SoundButton
                    variant="outline"
                    size="icon"
                    onClick={handleSwapTokens}
                    disabled={!sourceToken || !destinationToken}
                    className="border-2 border-black"
                  >
                    <Repeat className="h-4 w-4" />
                  </SoundButton>
                </div>
              </div>

              {/* Destination Token */}
              <div className="space-y-2">
                <Label htmlFor="destinationToken" className="font-mono">
                  TO
                </Label>
                <Select value={destinationToken?.id || ""} onValueChange={handleDestinationTokenChange}>
                  <SelectTrigger id="destinationToken" className="border-2 border-black" onClick={withClickSound()}>
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black">
                    {gameTokens.map((token) => (
                      <SelectItem key={`dest-${token.id}`} value={token.id} disabled={token.id === sourceToken?.id}>
                        <div className="flex items-center gap-2">
                          <Image src={token.icon || "/placeholder.svg"} alt={token.name} width={20} height={20} />
                          <span>{token.name}</span>
                          <span className="text-muted-foreground text-xs">({token.gameName})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination Amount */}
              <div className="space-y-2">
                <Label htmlFor="destinationAmount" className="font-mono">
                  YOU RECEIVE
                </Label>
                <Input
                  id="destinationAmount"
                  type="text"
                  placeholder="0.00"
                  value={destinationAmount}
                  readOnly
                  disabled
                  className="border-2 border-black"
                />
              </div>

              {/* Fee Information */}
              {sourceToken && destinationToken && sourceAmount && (
                <div className="rounded-md bg-[#f5efdc] p-3 text-sm border-2 border-black">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium font-mono">EXCHANGE RATE:</span>
                    <span className="font-mono">
                      1 {sourceToken.symbol} ={" "}
                      {(destinationToken.conversionRate / sourceToken.conversionRate).toFixed(4)}{" "}
                      {destinationToken.symbol}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1">
                      <span className="font-medium font-mono">MUTB FEE:</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="border-2 border-black">
                            <p>Fee distribution:</p>
                            <p>
                              {feeDistribution.sourceGame}% to {sourceToken.gameName}
                            </p>
                            <p>
                              {feeDistribution.destinationGame}% to {destinationToken.gameName}
                            </p>
                            <p>{feeDistribution.stakers}% to MUTB stakers</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-mono">
                      {calculateMutbFee(Number.parseFloat(sourceAmount) / sourceToken.conversionRate).toFixed(4)} MUTB
                    </span>
                  </div>
                </div>
              )}

              {/* Trade Button */}
              <SoundButton
                className="w-full bg-[#FFD54F] hover:bg-[#FFCA28] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono mt-2"
                disabled={!sourceToken || !destinationToken || !sourceAmount || Number.parseFloat(sourceAmount) <= 0}
                onClick={handleTrade}
              >
                TRADE
              </SoundButton>
            </div>
          </TabsContent>

          <TabsContent value="history">
            {tradeHistory.length > 0 ? (
              <div className="space-y-4">
                {tradeHistory.map((trade) => (
                  <div key={trade.id} className="border-2 border-black rounded-md p-3 bg-[#f5efdc]">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-2 border-black font-mono">
                          {trade.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground font-mono">
                          {new Date(trade.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <Badge variant="outline" className="bg-[#FFD54F] text-black border-2 border-black font-mono">
                        FEE: {trade.mutbFee.toFixed(4)} MUTB
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Image
                          src={trade.sourceToken.icon || "/placeholder.svg"}
                          alt={trade.sourceToken.name}
                          width={20}
                          height={20}
                        />
                        <span className="font-mono">
                          {trade.sourceAmount} {trade.sourceToken.symbol}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 mx-2" />
                      <div className="flex items-center gap-1">
                        <Image
                          src={trade.destinationToken.icon || "/placeholder.svg"}
                          alt={trade.destinationToken.name}
                          width={20}
                          height={20}
                        />
                        <span className="font-mono">
                          {trade.destinationAmount.toFixed(2)} {trade.destinationToken.symbol}
                        </span>
                      </div>
                    </div>

                    {trade.txSignature && (
                      <div className="text-xs text-muted-foreground truncate font-mono">
                        TX: {trade.txSignature.slice(0, 8)}...{trade.txSignature.slice(-8)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="font-mono">NO TRADE HISTORY YET</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      ;
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md border-2 border-black bg-[#fbf3de]">
          <DialogHeader>
            <DialogTitle className="font-mono">CONFIRM TRADE</DialogTitle>
            <DialogDescription>
              {tradeStatus === "idle" &&
                sourceToken &&
                destinationToken &&
                `You are about to trade ${sourceAmount} ${sourceToken.symbol} for ${destinationAmount} ${destinationToken.symbol}.`}
            </DialogDescription>
          </DialogHeader>

          {tradeStatus === "processing" && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
              <p className="font-mono">{statusMessage}</p>
            </div>
          )}

          {tradeStatus === "success" && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mb-4 border-2 border-black">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-center font-mono">{statusMessage}</p>
            </div>
          )}

          {tradeStatus === "error" && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mb-4 border-2 border-black">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-center font-mono">{statusMessage}</p>
            </div>
          )}

          {tradeStatus === "idle" && (
            <>
              {sourceToken && destinationToken && (
                <div className="py-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Image
                        src={sourceToken.icon || "/placeholder.svg"}
                        alt={sourceToken.name}
                        width={32}
                        height={32}
                      />
                      <div>
                        <p className="font-medium font-mono">
                          {sourceAmount} {sourceToken.symbol}
                        </p>
                        <p className="text-xs text-muted-foreground">{sourceToken.gameName}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5" />
                    <div className="flex items-center gap-2">
                      <Image
                        src={destinationToken.icon || "/placeholder.svg"}
                        alt={destinationToken.name}
                        width={32}
                        height={32}
                      />
                      <div>
                        <p className="font-medium font-mono">
                          {destinationAmount} {destinationToken.symbol}
                        </p>
                        <p className="text-xs text-muted-foreground">{destinationToken.gameName}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4 border-black" />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-mono">EXCHANGE RATE</span>
                      <span className="font-mono">
                        1 {sourceToken.symbol} ={" "}
                        {(destinationToken.conversionRate / sourceToken.conversionRate).toFixed(4)}{" "}
                        {destinationToken.symbol}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-mono">MUTB FEE</span>
                      <span className="font-mono">
                        {calculateMutbFee(Number.parseFloat(sourceAmount) / sourceToken.conversionRate).toFixed(4)} MUTB
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="font-mono">FEE TO {sourceToken.gameName.toUpperCase()}</span>
                      <span className="font-mono">
                        {(
                          (calculateMutbFee(Number.parseFloat(sourceAmount) / sourceToken.conversionRate) *
                            feeDistribution.sourceGame) /
                          100
                        ).toFixed(4)}{" "}
                        MUTB
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="font-mono">FEE TO {destinationToken.gameName.toUpperCase()}</span>
                      <span className="font-mono">
                        {(
                          (calculateMutbFee(Number.parseFloat(sourceAmount) / sourceToken.conversionRate) *
                            feeDistribution.destinationGame) /
                          100
                        ).toFixed(4)}{" "}
                        MUTB
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="font-mono">FEE TO MUTB STAKERS</span>
                      <span className="font-mono">
                        {(
                          (calculateMutbFee(Number.parseFloat(sourceAmount) / sourceToken.conversionRate) *
                            feeDistribution.stakers) /
                          100
                        ).toFixed(4)}{" "}
                        MUTB
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="flex sm:justify-between">
                <SoundButton
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-2 border-black text-black hover:bg-[#FFD54F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono"
                >
                  CANCEL
                </SoundButton>
                <SoundButton
                  onClick={executeTrade}
                  className="bg-[#FFD54F] hover:bg-[#FFCA28] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono"
                >
                  CONFIRM TRADE
                </SoundButton>
              </DialogFooter>
            </>
          )}

          {tradeStatus === "error" && (
            <DialogFooter>
              <SoundButton
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full border-2 border-black text-black hover:bg-[#FFD54F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono"
              >
                CLOSE
              </SoundButton>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
