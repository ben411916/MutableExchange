"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, Check, Wallet } from "lucide-react"
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js"
import MutableMarketplace from "./mutable-marketplace"

// Define types for Phantom wallet
type PhantomEvent = "connect" | "disconnect" | "accountChanged"

interface PhantomProvider {
  publicKey: { toString: () => string }
  isConnected: boolean
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>
  signTransaction: (transaction: any) => Promise<any>
  signAllTransactions: (transactions: any[]) => Promise<any[]>
  connect: () => Promise<{ publicKey: { toString: () => string } }>
  disconnect: () => Promise<void>
  on: (event: PhantomEvent, callback: () => void) => void
  isPhantom: boolean
}

type WindowWithSolana = Window & {
  solana?: PhantomProvider
}

// Use devnet for testing
const connection = new Connection(clusterApiUrl("devnet"), "confirmed")

export default function PhantomWalletConnector() {
  const [walletAvailable, setWalletAvailable] = useState(false)
  const [provider, setProvider] = useState<PhantomProvider | null>(null)
  const [connected, setConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string>("")
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Check if Phantom is available
  useEffect(() => {
    const checkForPhantom = async () => {
      const solWindow = window as WindowWithSolana

      if ("solana" in window && solWindow.solana?.isPhantom) {
        setProvider(solWindow.solana)
        setWalletAvailable(true)

        if (solWindow.solana.isConnected && solWindow.solana.publicKey) {
          setConnected(true)
          setPublicKey(solWindow.solana.publicKey.toString())
        }
      }
    }

    checkForPhantom()
  }, [])

  useEffect(() => {
    if (provider) {
      provider.on("connect", () => {
        setConnected(true)
        if (provider.publicKey) {
          setPublicKey(provider.publicKey.toString())
        }
      })

      provider.on("disconnect", () => {
        setConnected(false)
        setPublicKey("")
        setBalance(null)
      })

      provider.on("accountChanged", () => {
        if (provider.publicKey) {
          setPublicKey(provider.publicKey.toString())
        } else {
          setConnected(false)
          setPublicKey("")
          setBalance(null)
        }
      })

      // Check if already connected when component mounts
      if (provider.isConnected && provider.publicKey) {
        setConnected(true)
        setPublicKey(provider.publicKey.toString())
      }
    }
  }, [provider])

  // Fetch SOL balance when connected
  useEffect(() => {
    const getBalance = async () => {
      if (connected && publicKey) {
        try {
          const publicKeyObj = new PublicKey(publicKey)
          const balance = await connection.getBalance(publicKeyObj)
          setBalance(balance / 1e9) // Convert lamports to SOL
        } catch (error) {
          console.error("Error fetching balance:", error)
          setBalance(null)
        }
      }
    }

    getBalance()
  }, [connected, publicKey])

  const connectWallet = async () => {
    if (!provider) return

    try {
      setLoading(true)
      if (!provider.isConnected) {
        const response = await provider.connect()
        setPublicKey(response.publicKey.toString())
        setConnected(true)
      } else {
        console.log("Already connected to Phantom Wallet")
        // Make sure we have the publicKey even if already connected
        if (provider.publicKey) {
          setPublicKey(provider.publicKey.toString())
        }
      }
    } catch (error) {
      console.error("Connection error:", error)
      if (error instanceof Error) {
        alert(`Connection failed: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const disconnectWallet = async () => {
    if (provider) {
      try {
        await provider.disconnect()
      } catch (error) {
        console.error("Disconnection error:", error)
      }
    }
  }

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-md mx-auto bg-white border border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Phantom Wallet
          </CardTitle>
          <CardDescription>Connect your Solana wallet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connected ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Address:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{shortenAddress(publicKey)}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Connected
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Balance:</span>
                {balance !== null ? (
                  <span className="font-mono">{balance} SOL</span>
                ) : (
                  <Skeleton className="h-4 w-20" />
                )}
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="text-muted-foreground mb-4">
                Connect your Phantom wallet to interact with Solana blockchain
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!connected ? (
            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={connectWallet} disabled={loading}>
              {loading ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={disconnectWallet}>
              Disconnect
            </Button>
          )}
        </CardFooter>
      </Card>

      {connected && (
        <MutableMarketplace publicKey={publicKey} balance={balance} provider={provider} connection={connection} />
      )}
    </div>
  )
}
