"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, Check, Wallet } from "lucide-react"
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js"
import MutablePlatform from "./mutable-platform"
import Image from "next/image"

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

// Define types for Solflare wallet
interface SolflareProvider {
  publicKey: { toString: () => string }
  isConnected: boolean
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>
  signTransaction: (transaction: any) => Promise<any>
  signAllTransactions: (transactions: any[]) => Promise<any[]>
  connect: () => Promise<{ publicKey: { toString: () => string } }>
  disconnect: () => Promise<void>
  on: (event: PhantomEvent, callback: () => void) => void
  isSolflare: boolean
}

type WindowWithSolana = Window & {
  solana?: PhantomProvider
  solflare?: SolflareProvider
}

// Use devnet for testing
const connection = new Connection(clusterApiUrl("devnet"), "confirmed")

// Wallet types
type WalletType = "phantom" | "solflare"

interface WalletInfo {
  name: string
  type: WalletType
  icon: string
  available: boolean
}

export default function MultiWalletConnector() {
  const [activeWallet, setActiveWallet] = useState<WalletType | null>(null)
  const [wallets, setWallets] = useState<WalletInfo[]>([
    {
      name: "Phantom",
      type: "phantom",
      icon: "/images/phantom-icon.svg",
      available: false,
    },
    {
      name: "Solflare",
      type: "solflare",
      icon: "/images/solflare-icon.png",
      available: false,
    },
  ])

  // Wallet state
  const [provider, setProvider] = useState<PhantomProvider | SolflareProvider | null>(null)
  const [connected, setConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string>("")
  const [balance, setBalance] = useState<number | null>(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Check for available wallets
  useEffect(() => {
    const checkForWallets = async () => {
      const solWindow = window as WindowWithSolana

      // Check for Phantom
      const phantomAvailable = "solana" in window && solWindow.solana?.isPhantom

      // Check for Solflare
      const solflareAvailable = "solflare" in window && solWindow.solflare?.isSolflare

      setWallets((prev) =>
        prev.map((wallet) => {
          if (wallet.type === "phantom") {
            return { ...wallet, available: phantomAvailable }
          } else if (wallet.type === "solflare") {
            return { ...wallet, available: solflareAvailable }
          }
          return wallet
        }),
      )

      // Check if already connected to Phantom
      if (phantomAvailable && solWindow.solana!.isConnected && solWindow.solana!.publicKey) {
        setProvider(solWindow.solana!)
        setConnected(true)
        setPublicKey(solWindow.solana!.publicKey.toString())
        setActiveWallet("phantom")
      }

      // Check if already connected to Solflare
      else if (solflareAvailable && solWindow.solflare!.isConnected && solWindow.solflare!.publicKey) {
        setProvider(solWindow.solflare!)
        setConnected(true)
        setPublicKey(solWindow.solflare!.publicKey.toString())
        setActiveWallet("solflare")
      }
    }

    checkForWallets()
  }, [])

  // Set up wallet event listeners
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
        setActiveWallet(null)
      })

      provider.on("accountChanged", () => {
        if (provider.publicKey) {
          setPublicKey(provider.publicKey.toString())
        } else {
          setConnected(false)
          setPublicKey("")
          setBalance(null)
          setActiveWallet(null)
        }
      })
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

  // Connect to wallet
  const connectWallet = async (walletType: WalletType) => {
    const solWindow = window as WindowWithSolana
    let walletProvider: PhantomProvider | SolflareProvider | null = null

    if (walletType === "phantom") {
      if (!solWindow.solana) {
        alert("Phantom wallet not detected. Please ensure you have Phantom wallet extension installed and signed in.")
        return
      }
      walletProvider = solWindow.solana
    } else if (walletType === "solflare") {
      if (!solWindow.solflare) {
        alert("Solflare wallet not detected. Please ensure you have Solflare wallet extension installed and signed in.")
        return
      }
      walletProvider = solWindow.solflare
    }

    if (!walletProvider) return

    try {
      setLoading(true)
      if (!walletProvider.isConnected) {
        const response = await walletProvider.connect()
        setPublicKey(response.publicKey.toString())
        setConnected(true)
        setProvider(walletProvider)
        setActiveWallet(walletType)
      } else {
        console.log(`Already connected to ${walletType} Wallet`)
        // Make sure we have the publicKey even if already connected
        if (walletProvider.publicKey) {
          setPublicKey(walletProvider.publicKey.toString())
          setConnected(true)
          setProvider(walletProvider)
          setActiveWallet(walletType)
        }
      }
    } catch (error) {
      console.error(`${walletType} connection error:`, error)
      if (error instanceof Error) {
        alert(
          `Connection failed: ${error.message}. Please ensure you have ${walletType} wallet extension installed and signed in.`,
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // Disconnect from wallet
  const disconnectWallet = async () => {
    if (provider) {
      try {
        await provider.disconnect()
      } catch (error) {
        console.error("Disconnection error:", error)
      }
    }
  }

  // Copy address to clipboard
  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Shorten address for display
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div className="space-y-6">
      {!connected && (
        <div className="flex justify-center mb-6">
          <Image src="/images/mutable-logo.png" alt="Mutable Logo" width={200} height={200} />
        </div>
      )}

      <Card className="w-full max-w-md mx-auto bg-[#fbf3de] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono">
            <Wallet className="h-5 w-5" />
            SOLANA WALLET
          </CardTitle>
          <CardDescription>Connect your Solana wallet to use Mutable</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connected ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Wallet:</span>
                <div className="flex items-center gap-2">
                  <Image
                    src={activeWallet === "phantom" ? "/images/phantom-icon.svg" : "/images/solflare-icon.png"}
                    alt={activeWallet === "phantom" ? "Phantom" : "Solflare"}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <Badge variant="outline" className="bg-[#FFD54F] text-black border-2 border-black font-mono">
                    {activeWallet?.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Address:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">{shortenAddress(publicKey)}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-mono">
                  CONNECTED
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
            <div className="py-2">
              <div className="grid grid-cols-1 gap-3">
                {wallets.map((wallet) => (
                  <Button
                    key={wallet.type}
                    onClick={() => connectWallet(wallet.type)}
                    disabled={loading || !wallet.available}
                    className="w-full bg-[#FFD54F] hover:bg-[#FFCA28] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono justify-start h-12"
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={wallet.icon || "/placeholder.svg"}
                        alt={wallet.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <span>{wallet.name}</span>
                      {!wallet.available && <span className="text-xs ml-auto">(Not Detected)</span>}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!connected ? (
            <div className="text-center w-full text-sm text-muted-foreground">
              <p>Don't have a Solana wallet?</p>
              <div className="flex justify-center gap-4 mt-2">
                <a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Get Phantom
                </a>
                <a
                  href="https://solflare.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Get Solflare
                </a>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-2 border-black text-black hover:bg-[#FFD54F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono"
              onClick={disconnectWallet}
            >
              DISCONNECT
            </Button>
          )}
        </CardFooter>
      </Card>

      {connected && (
        <MutablePlatform publicKey={publicKey} balance={balance} provider={provider} connection={connection} />
      )}
    </div>
  )
}
