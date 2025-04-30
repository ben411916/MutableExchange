"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { marketplaceItems } from "@/data/marketplace-items"
import type { MarketplaceItem, PurchaseHistory } from "@/types/marketplace"
import { ShoppingCart, Check, AlertCircle, Clock } from "lucide-react"
import Image from "next/image"
import { type Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"

interface MarketplaceProps {
  publicKey: string
  balance: number | null
  provider: any
  connection: Connection
}

export default function Marketplace({ publicKey, balance, provider, connection }: MarketplaceProps) {
  const [selectedTab, setSelectedTab] = useState("all")
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([])
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [purchaseStatus, setPurchaseStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")

  // Get unique currency types for tabs
  const currencyTypes = [
    "all",
    ...new Set(marketplaceItems.map((item) => item.currency.toLowerCase().replace(" ", "-"))),
  ]

  // Filter items based on selected tab
  const filteredItems =
    selectedTab === "all"
      ? marketplaceItems
      : marketplaceItems.filter((item) => item.currency.toLowerCase().replace(" ", "-") === selectedTab)

  const handlePurchase = async (item: MarketplaceItem) => {
    setSelectedItem(item)
    setIsDialogOpen(true)
    setPurchaseStatus("idle")
    setStatusMessage("")
  }

  const confirmPurchase = async () => {
    if (!selectedItem || !publicKey || !provider) return

    try {
      setPurchaseStatus("processing")
      setStatusMessage("Processing your transaction...")

      // Create a new transaction
      const transaction = new Transaction()

      // Add a transfer instruction to the transaction
      const senderPublicKey = new PublicKey(publicKey)

      // This would be your marketplace wallet address in production
      // For this POC, we'll just use a random valid public key
      const marketplaceWallet = new PublicKey("11111111111111111111111111111111")

      // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
      const lamports = selectedItem.price * LAMPORTS_PER_SOL

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: senderPublicKey,
          toPubkey: marketplaceWallet,
          lamports: lamports,
        }),
      )

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = senderPublicKey

      // Sign the transaction
      const signedTransaction = await provider.signTransaction(transaction)

      // Send the transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())

      // Confirm the transaction
      await connection.confirmTransaction(signature, "confirmed")

      // Add to purchase history
      const purchase: PurchaseHistory = {
        id: `purchase-${Date.now()}`,
        itemId: selectedItem.id,
        name: selectedItem.name,
        amount: selectedItem.amount,
        price: selectedItem.price,
        date: new Date(),
        transactionSignature: signature,
      }

      setPurchaseHistory((prev) => [purchase, ...prev])
      setPurchaseStatus("success")
      setStatusMessage(`Successfully purchased ${selectedItem.name}!`)

      // Close dialog after 2 seconds on success
      setTimeout(() => {
        setIsDialogOpen(false)
        setPurchaseStatus("idle")
      }, 2000)
    } catch (error) {
      console.error("Purchase error:", error)
      setPurchaseStatus("error")
      setStatusMessage(error instanceof Error ? error.message : "Transaction failed")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#FBF3DF] border border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Virtual Currency Marketplace
          </CardTitle>
          <CardDescription>Purchase virtual currencies with your Solana wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-4">
              {currencyTypes.map((type) => (
                <TabsTrigger key={type} value={type} className="capitalize">
                  {type === "all" ? "All" : type.replace("-", " ")}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedTab} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="flex p-4">
                      <div className="mr-4 flex-shrink-0">
                        <div className="h-20 w-20 rounded-md bg-gray-100 flex items-center justify-center">
                          <Image src={item.image || "/placeholder.svg"} alt={item.name} width={80} height={80} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {item.price} SOL
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => handlePurchase(item)}
                            disabled={balance === null || balance < item.price}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Purchase
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {purchaseHistory.length > 0 && (
        <Card className="bg-[#FBF3DF] border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Purchase History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {purchaseHistory.map((purchase) => (
                <div key={purchase.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{purchase.name}</p>
                    <p className="text-sm text-muted-foreground">{purchase.date.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {purchase.price} SOL
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              {purchaseStatus === "idle" &&
                selectedItem &&
                `You are about to purchase ${selectedItem.name} for ${selectedItem.price} SOL.`}
            </DialogDescription>
          </DialogHeader>

          {purchaseStatus === "processing" && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700 mb-4"></div>
              <p>{statusMessage}</p>
            </div>
          )}

          {purchaseStatus === "success" && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-center">{statusMessage}</p>
            </div>
          )}

          {purchaseStatus === "error" && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-center">{statusMessage}</p>
            </div>
          )}

          {purchaseStatus === "idle" && (
            <DialogFooter className="flex sm:justify-between">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmPurchase} className="bg-purple-600 hover:bg-purple-700">
                Confirm Purchase
              </Button>
            </DialogFooter>
          )}

          {purchaseStatus === "error" && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full">
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
