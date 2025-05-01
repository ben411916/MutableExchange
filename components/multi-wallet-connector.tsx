"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, Check, Wallet, TestTube, ChevronUp, ChevronDown } from "lucide-react"
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js"
import MutablePlatform from "./mutable-platform"
import Image from "next/image"
import SoundButton from "./sound-button"
import { playIntroSound, initializeAudio } from "@/utils/sound-utils"

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
type WalletType = "phantom" | "solflare" | "test"

interface WalletInfo {
  name: string
  type: WalletType
  icon: string
  available: boolean
}

// Mock provider for test mode
const createMockProvider = () => {
  const mockPublicKey = {
    toString: () => "TestModeWallet1111111111111111111111111",
  }

  return {
    publicKey: mockPublicKey,
    isConnected: true,
    signMessage: async (message: Uint8Array) => ({ signature: new Uint8Array([1, 2, 3]) }),
    signTransaction: async (transaction: any) => transaction,
    signAllTransactions: async (transactions: any[]) => transactions,
    connect: async () => ({ publicKey: mockPublicKey }),
    disconnect: async () => {},
    on: (event: PhantomEvent, callback: () => void) => {},
    isPhantom: false,
    isSolflare: false,
    isTestMode: true,
  }
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
    {
      name: "Test Mode",
      type: "test",
      icon: "/placeholder.svg?height=24&width=24",
      available: true,
    },
  ])

  // Wallet state
  const [provider, setProvider] = useState<PhantomProvider | SolflareProvider | any>(null)
  const [connected, setConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string>("")
  const [balance, setBalance] = useState<number | null>(null)
  const [isTestMode, setIsTestMode] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Initialize audio on component mount
  useEffect(() => {
    const handleFirstInteraction = () => {
      initializeAudio()
      document.removeEventListener("click", handleFirstInteraction)
    }

    document.addEventListener("click", handleFirstInteraction)

    return () => {
      document.removeEventListener("click", handleFirstInteraction)
    }
  }, [])

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
    if (provider && !isTestMode) {
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
  }, [provider, isTestMode])

  // Fetch SOL balance when connected
  useEffect(() => {
    const getBalance = async () => {
      if (connected && publicKey) {
        if (isTestMode) {
          // Set mock balance for test mode
          setBalance(5.0)
          return
        }

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
  }, [connected, publicKey, isTestMode])

  // Update the connectWallet function to handle audio better

  // Connect to wallet
  const connectWallet = async (walletType: WalletType) => {
    // Initialize audio first (this requires user interaction)
    initializeAudio().catch((err) => console.warn("Audio initialization failed:", err))

    // Handle test mode
    if (walletType === "test") {
      const mockProvider = createMockProvider()
      setProvider(mockProvider)
      setPublicKey(mockProvider.publicKey.toString())
      setConnected(true)
      setActiveWallet("test")
      setIsTestMode(true)
      setBalance(5.0) // Set mock balance

      // Play intro sound with a slight delay to ensure audio is initialized
      setTimeout(() => playIntroSound(), 100)
      return
    }

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
        setIsTestMode(false)

        // Play intro sound with a slight delay
        setTimeout(() => playIntroSound(), 100)
      } else {
        console.log(`Already connected to ${walletType} Wallet`)
        // Make sure we have the publicKey even if already connected
        if (walletProvider.publicKey) {
          setPublicKey(walletProvider.publicKey.toString())
          setConnected(true)
          setProvider(walletProvider)
          setActiveWallet(walletType)
          setIsTestMode(false)

          // Play intro sound with a slight delay
          setTimeout(() => playIntroSound(), 100)
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
    if (isTestMode) {
      // Just reset state for test mode
      setConnected(false)
      setPublicKey("")
      setBalance(null)
      setActiveWallet(null)
      setIsTestMode(false)
      setProvider(null)
      return
    }

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

  // Toggle wallet collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Render the collapsed wallet view when connected
  const renderCollapsedWallet = () => {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isTestMode ? (
            <TestTube className="h-5 w-5 text-purple-500" />
          ) : (
            <Image
              src={activeWallet === "phantom" ? "/images/phantom-icon.svg" : "/images/solflare-icon.png"}
              alt={activeWallet === "phantom" ? "Phantom" : "Solflare"}
              width={20}
              height={20}
              className="rounded-full"
            />
          )}
          <div className="flex items-center gap-1">
            <span className="text-sm font-mono">{shortenAddress(publicKey)}</span>
            <Badge
              variant="outline"
              className={`${
                isTestMode
                  ? "bg-purple-100 text-purple-800 border-purple-300"
                  : "bg-green-50 text-green-700 border-green-200"
              } font-mono text-xs`}
            >
              {isTestMode ? "TEST" : balance !== null ? `${balance} SOL` : "..."}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleCollapse}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!connected && (
        <div className="flex justify-center mb-2 sm:mb-6">
          <Image
            src="/images/mutable-logo.png"
            alt="Mutable Logo"
            width={200}
            height={200}
            className="w-32 h-32 sm:w-48 sm:h-48 md:w-[200px] md:h-[200px]"
          />
        </div>
      )}

      <Card className="w-full max-w-md mx-auto bg-[#fbf3de] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <CardTitle className="font-mono">SOLANA WALLET</CardTitle>
          </div>
          {connected && !isCollapsed && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleCollapse}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>

        {connected && isCollapsed ? (
          <CardContent className="pt-4">{renderCollapsedWallet()}</CardContent>
        ) : (
          <>
            {!connected && (
              <CardDescription className="px-6">Connect your Solana wallet to use Mutable</CardDescription>
            )}
            <CardContent className="space-y-4">
              {connected ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Wallet:</span>
                    <div className="flex items-center gap-2">
                      {isTestMode ? (
                        <>
                          <TestTube className="h-5 w-5 text-purple-500" />
                          <Badge
                            variant="outline"
                            className="bg-purple-100 text-purple-800 border-2 border-purple-300 font-mono"
                          >
                            TEST MODE
                          </Badge>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
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
                  {isTestMode && (
                    <div className="bg-purple-50 p-3 rounded-md border border-purple-200 text-sm text-purple-800">
                      <p className="font-medium mb-1">Test Mode Active</p>
                      <p>You're using a simulated wallet for testing. No real transactions will be made.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-2">
                  <div className="grid grid-cols-1 gap-3">
                    <SoundButton
                      key={wallets[0].type}
                      onClick={() => connectWallet(wallets[0].type)}
                      disabled={loading || (wallets[0].type !== "test" && !wallets[0].available)}
                      className={`w-full border-2 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono justify-start h-12 ${
                        wallets[0].type === "test"
                          ? "bg-purple-100 hover:bg-purple-200 border-purple-300"
                          : "bg-[#FFD54F] hover:bg-[#FFCA28] border-black"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {wallets[0].type === "test" ? (
                          <TestTube className="h-5 w-5" />
                        ) : (
                          <Image
                            src={wallets[0].icon || "/placeholder.svg"}
                            alt={wallets[0].name}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        )}
                        <span>{wallets[0].name}</span>
                        {wallets[0].type !== "test" && !wallets[0].available && (
                          <span className="text-xs ml-auto">(Not Detected)</span>
                        )}
                      </div>
                    </SoundButton>
                    <SoundButton
                      key={wallets[1].type}
                      onClick={() => connectWallet(wallets[1].type)}
                      disabled={loading || (wallets[1].type !== "test" && !wallets[1].available)}
                      className={`w-full border-2 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono justify-start h-12 ${
                        wallets[1].type === "test"
                          ? "bg-purple-100 hover:bg-purple-200 border-purple-300"
                          : "bg-[#FFD54F] hover:bg-[#FFCA28] border-black"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {wallets[1].type === "test" ? (
                          <TestTube className="h-5 w-5" />
                        ) : (
                          <Image
                            src={wallets[1].icon || "/placeholder.svg"}
                            alt={wallets[1].name}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        )}
                        <span>{wallets[1].name}</span>
                        {wallets[1].type !== "test" && !wallets[1].available && (
                          <span className="text-xs ml-auto">(Not Detected)</span>
                        )}
                      </div>
                    </SoundButton>
                    <SoundButton
                      key={wallets[2].type}
                      onClick={() => connectWallet(wallets[2].type)}
                      disabled={loading || (wallets[2].type !== "test" && !wallets[2].available)}
                      className={`w-full border-2 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono justify-start h-12 ${
                        wallets[2].type === "test"
                          ? "bg-purple-100 hover:bg-purple-200 border-purple-300"
                          : "bg-[#FFD54F] hover:bg-[#FFCA28] border-black"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {wallets[2].type === "test" ? (
                          <TestTube className="h-5 w-5" />
                        ) : (
                          <Image
                            src={wallets[2].icon || "/placeholder.svg"}
                            alt={wallets[2].name}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        )}
                        <span>{wallets[2].name}</span>
                        {wallets[2].type !== "test" && !wallets[2].available && (
                          <span className="text-xs ml-auto">(Not Detected)</span>
                        )}
                      </div>
                    </SoundButton>
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
                <SoundButton
                  variant="outline"
                  className={`w-full border-2 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono ${
                    isTestMode ? "border-purple-300 hover:bg-purple-100" : "border-black hover:bg-[#FFD54F]"
                  }`}
                  onClick={disconnectWallet}
                >
                  DISCONNECT
                </SoundButton>
              )}
            </CardFooter>
          </>
        )}
      </Card>

      {connected && (
        <MutablePlatform publicKey={publicKey} balance={balance} provider={provider} connection={connection} />
      )}
    </div>
  )
}
