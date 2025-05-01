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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

// Define types for MetaMask and Ethereum
interface EthereumProvider {
  isMetaMask?: boolean
  isCoinbaseWallet?: boolean
  selectedAddress: string
  isConnected: () => boolean
  request: (args: { method: string; params?: any[] }) => Promise<any>
  on: (event: string, callback: (accounts: string[]) => void) => void
  removeListener: (event: string, callback: (accounts: string[]) => void) => void
}

type WindowWithWallets = Window & {
  solana?: PhantomProvider
  ethereum?: EthereumProvider
}

// Use devnet for Solana testing
const solanaConnection = new Connection(clusterApiUrl("devnet"), "confirmed")

// Wallet types
type WalletType = "phantom" | "metamask" | "coinbase" | "walletconnect"

interface WalletInfo {
  name: string
  type: WalletType
  icon: string
  network: "solana" | "ethereum"
  available: boolean
}

export default function MultiWalletConnector() {
  const [activeWallet, setActiveWallet] = useState<WalletType | null>(null)
  const [wallets, setWallets] = useState<WalletInfo[]>([
    {
      name: "Phantom",
      type: "phantom",
      icon: "/images/phantom-icon.svg",
      network: "solana",
      available: false,
    },
    {
      name: "MetaMask",
      type: "metamask",
      icon: "/images/metamask-icon.jpg",
      network: "ethereum",
      available: false,
    },
    {
      name: "Coinbase Wallet",
      type: "coinbase",
      icon: "/images/coinbase-icon.svg",
      network: "ethereum",
      available: false,
    },
    {
      name: "WalletConnect",
      type: "walletconnect",
      icon: "/images/wallet-connect-icon.png",
      network: "ethereum",
      available: false,
    },
  ])

  // Solana wallet state
  const [phantomProvider, setPhantomProvider] = useState<PhantomProvider | null>(null)
  const [solanaConnected, setSolanaConnected] = useState(false)
  const [solanaPublicKey, setSolanaPublicKey] = useState<string>("")
  const [solanaBalance, setSolanaBalance] = useState<number | null>(null)

  // Ethereum wallet state
  const [ethereumProvider, setEthereumProvider] = useState<EthereumProvider | null>(null)
  const [ethereumConnected, setEthereumConnected] = useState(false)
  const [ethereumAddress, setEthereumAddress] = useState<string>("")
  const [ethereumBalance, setEthereumBalance] = useState<string | null>(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"solana" | "ethereum">("solana")

  // Check for available wallets
  useEffect(() => {
    const checkForWallets = async () => {
      const windowWithWallets = window as WindowWithWallets

      // Check for Phantom
      const phantomAvailable = "solana" in window && windowWithWallets.solana?.isPhantom

      // Check for MetaMask
      const metamaskAvailable = "ethereum" in window && windowWithWallets.ethereum?.isMetaMask

      // Check for Coinbase Wallet
      const coinbaseAvailable = "ethereum" in window && windowWithWallets.ethereum?.isCoinbaseWallet

      // WalletConnect is typically initialized by the app, so we'll just show it as an option

      setWallets((prev) =>
        prev.map((wallet) => {
          if (wallet.type === "phantom") {
            return { ...wallet, available: phantomAvailable }
          } else if (wallet.type === "metamask") {
            return { ...wallet, available: metamaskAvailable }
          } else if (wallet.type === "coinbase") {
            return { ...wallet, available: coinbaseAvailable }
          }
          return wallet
        }),
      )

      // Set providers if available
      if (phantomAvailable) {
        setPhantomProvider(windowWithWallets.solana!)

        // Check if already connected
        if (windowWithWallets.solana!.isConnected && windowWithWallets.solana!.publicKey) {
          setSolanaConnected(true)
          setSolanaPublicKey(windowWithWallets.solana!.publicKey.toString())
          setActiveWallet("phantom")
          setActiveTab("solana")
        }
      }

      if (metamaskAvailable || coinbaseAvailable) {
        setEthereumProvider(windowWithWallets.ethereum!)

        // Check if already connected
        if (windowWithWallets.ethereum!.selectedAddress) {
          setEthereumConnected(true)
          setEthereumAddress(windowWithWallets.ethereum!.selectedAddress)
          setActiveWallet(metamaskAvailable ? "metamask" : "coinbase")
          setActiveTab("ethereum")
        }
      }
    }

    checkForWallets()
  }, [])

  // Set up Phantom event listeners
  useEffect(() => {
    if (phantomProvider) {
      phantomProvider.on("connect", () => {
        setSolanaConnected(true)
        if (phantomProvider.publicKey) {
          setSolanaPublicKey(phantomProvider.publicKey.toString())
        }
      })

      phantomProvider.on("disconnect", () => {
        setSolanaConnected(false)
        setSolanaPublicKey("")
        setSolanaBalance(null)
        if (activeWallet === "phantom") {
          setActiveWallet(null)
        }
      })

      phantomProvider.on("accountChanged", () => {
        if (phantomProvider.publicKey) {
          setSolanaPublicKey(phantomProvider.publicKey.toString())
        } else {
          setSolanaConnected(false)
          setSolanaPublicKey("")
          setSolanaBalance(null)
          if (activeWallet === "phantom") {
            setActiveWallet(null)
          }
        }
      })
    }
  }, [phantomProvider, activeWallet])

  // Set up Ethereum event listeners
  useEffect(() => {
    if (ethereumProvider) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setEthereumConnected(false)
          setEthereumAddress("")
          setEthereumBalance(null)
          if (activeWallet === "metamask" || activeWallet === "coinbase") {
            setActiveWallet(null)
          }
        } else {
          setEthereumConnected(true)
          setEthereumAddress(accounts[0])
        }
      }

      ethereumProvider.on("accountsChanged", handleAccountsChanged)

      return () => {
        ethereumProvider.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [ethereumProvider, activeWallet])

  // Fetch Solana balance when connected
  useEffect(() => {
    const getSolanaBalance = async () => {
      if (solanaConnected && solanaPublicKey) {
        try {
          const publicKeyObj = new PublicKey(solanaPublicKey)
          const balance = await solanaConnection.getBalance(publicKeyObj)
          setSolanaBalance(balance / 1e9) // Convert lamports to SOL
        } catch (error) {
          console.error("Error fetching Solana balance:", error)
          setSolanaBalance(null)
        }
      }
    }

    getSolanaBalance()
  }, [solanaConnected, solanaPublicKey])

  // Fetch Ethereum balance when connected
  useEffect(() => {
    const getEthereumBalance = async () => {
      if (ethereumConnected && ethereumAddress && ethereumProvider) {
        try {
          const balance = await ethereumProvider.request({
            method: "eth_getBalance",
            params: [ethereumAddress, "latest"],
          })

          // Convert from wei to ETH
          const ethBalance = Number.parseInt(balance, 16) / 1e18
          setEthereumBalance(ethBalance.toFixed(4))
        } catch (error) {
          console.error("Error fetching Ethereum balance:", error)
          setEthereumBalance(null)
        }
      }
    }

    getEthereumBalance()
  }, [ethereumConnected, ethereumAddress, ethereumProvider])

  // Connect to Phantom wallet
  const connectPhantom = async () => {
    if (!phantomProvider) {
      alert("Phantom wallet not detected. Please ensure you have Phantom wallet extension installed and signed in.")
      return
    }

    try {
      setLoading(true)
      if (!phantomProvider.isConnected) {
        const response = await phantomProvider.connect()
        setSolanaPublicKey(response.publicKey.toString())
        setSolanaConnected(true)
        setActiveWallet("phantom")
        setActiveTab("solana")
      } else {
        console.log("Already connected to Phantom Wallet")
        // Make sure we have the publicKey even if already connected
        if (phantomProvider.publicKey) {
          setSolanaPublicKey(phantomProvider.publicKey.toString())
          setSolanaConnected(true)
          setActiveWallet("phantom")
          setActiveTab("solana")
        }
      }
    } catch (error) {
      console.error("Phantom connection error:", error)
      if (error instanceof Error) {
        alert(
          `Connection failed: ${error.message}. Please ensure you have Phantom wallet extension installed and signed in.`,
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // Connect to Ethereum wallet (MetaMask or Coinbase)
  const connectEthereum = async (walletType: "metamask" | "coinbase") => {
    if (!ethereumProvider) {
      alert(
        `${walletType === "metamask" ? "MetaMask" : "Coinbase Wallet"} not detected. Please ensure you have the extension installed and signed in.`,
      )
      return
    }

    try {
      setLoading(true)
      const accounts = await ethereumProvider.request({ method: "eth_requestAccounts" })

      if (accounts.length > 0) {
        setEthereumAddress(accounts[0])
        setEthereumConnected(true)
        setActiveWallet(walletType)
        setActiveTab("ethereum")
      }
    } catch (error) {
      console.error("Ethereum connection error:", error)
      if (error instanceof Error) {
        alert(
          `Connection failed: ${error.message}. Please ensure you have ${
            walletType === "metamask" ? "MetaMask" : "Coinbase Wallet"
          } extension installed and signed in.`,
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // Connect to WalletConnect
  const connectWalletConnect = async () => {
    alert("WalletConnect integration coming soon!")
  }

  // Connect to selected wallet
  const connectWallet = async (walletType: WalletType) => {
    switch (walletType) {
      case "phantom":
        await connectPhantom()
        break
      case "metamask":
        await connectEthereum("metamask")
        break
      case "coinbase":
        await connectEthereum("coinbase")
        break
      case "walletconnect":
        await connectWalletConnect()
        break
    }
  }

  // Disconnect from current wallet
  const disconnectWallet = async () => {
    if (activeWallet === "phantom" && phantomProvider) {
      try {
        await phantomProvider.disconnect()
        setSolanaConnected(false)
        setSolanaPublicKey("")
        setSolanaBalance(null)
        setActiveWallet(null)
      } catch (error) {
        console.error("Phantom disconnection error:", error)
      }
    } else if ((activeWallet === "metamask" || activeWallet === "coinbase") && ethereumProvider) {
      // For Ethereum wallets, there's no standard disconnect method
      // We'll just reset our state
      setEthereumConnected(false)
      setEthereumAddress("")
      setEthereumBalance(null)
      setActiveWallet(null)
    }
  }

  // Copy address to clipboard
  const copyAddress = async () => {
    const addressToCopy = activeTab === "solana" ? solanaPublicKey : ethereumAddress

    if (addressToCopy) {
      await navigator.clipboard.writeText(addressToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Shorten address for display
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  // Get connected status based on active tab
  const isConnected = activeTab === "solana" ? solanaConnected : ethereumConnected

  // Get address based on active tab
  const address = activeTab === "solana" ? solanaPublicKey : ethereumAddress

  // Get balance based on active tab
  const balance =
    activeTab === "solana"
      ? solanaBalance !== null
        ? `${solanaBalance} SOL`
        : null
      : ethereumBalance !== null
        ? `${ethereumBalance} ETH`
        : null

  return (
    <div className="space-y-6">
      {!activeWallet && (
        <div className="flex justify-center mb-6">
          <Image src="/images/mutable-logo.png" alt="Mutable Logo" width={200} height={200} />
        </div>
      )}

      <Card className="w-full max-w-md mx-auto bg-[#fbf3de] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono">
            <Wallet className="h-5 w-5" />
            CONNECT WALLET
          </CardTitle>
          <CardDescription>Connect your wallet to use Mutable</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {activeWallet ? (
            <Tabs
              defaultValue={activeTab}
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "solana" | "ethereum")}
            >
              <TabsList className="mb-4 border-2 border-black bg-[#FFD54F]">
                <TabsTrigger
                  value="solana"
                  className="data-[state=active]:bg-white data-[state=active]:text-black font-mono"
                  disabled={!solanaConnected}
                >
                  SOLANA
                </TabsTrigger>
                <TabsTrigger
                  value="ethereum"
                  className="data-[state=active]:bg-white data-[state=active]:text-black font-mono"
                  disabled={!ethereumConnected}
                >
                  ETHEREUM
                </TabsTrigger>
              </TabsList>

              <TabsContent value="solana" className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Wallet:</span>
                  <div className="flex items-center gap-2">
                    <Image
                      src="/images/phantom-icon.svg"
                      alt="Phantom"
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    <Badge variant="outline" className="bg-[#FFD54F] text-black border-2 border-black font-mono">
                      PHANTOM
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Address:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{shortenAddress(solanaPublicKey)}</span>
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
                  {solanaBalance !== null ? (
                    <span className="font-mono">{solanaBalance} SOL</span>
                  ) : (
                    <Skeleton className="h-4 w-20" />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ethereum" className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Wallet:</span>
                  <div className="flex items-center gap-2">
                    <Image
                      src={activeWallet === "metamask" ? "/images/metamask-icon.jpg" : "/images/coinbase-icon.svg"}
                      alt={activeWallet === "metamask" ? "MetaMask" : "Coinbase"}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    <Badge variant="outline" className="bg-[#FFD54F] text-black border-2 border-black font-mono">
                      {activeWallet === "metamask" ? "METAMASK" : "COINBASE"}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Address:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{shortenAddress(ethereumAddress)}</span>
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
                  {ethereumBalance !== null ? (
                    <span className="font-mono">{ethereumBalance} ETH</span>
                  ) : (
                    <Skeleton className="h-4 w-20" />
                  )}
                </div>
              </TabsContent>
            </Tabs>
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

        {activeWallet && (
          <CardFooter>
            <Button
              variant="outline"
              className="w-full border-2 border-black text-black hover:bg-[#FFD54F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono"
              onClick={disconnectWallet}
            >
              DISCONNECT
            </Button>
          </CardFooter>
        )}
      </Card>

      {activeWallet === "phantom" && solanaConnected && (
        <MutablePlatform
          publicKey={solanaPublicKey}
          balance={solanaBalance}
          provider={phantomProvider}
          connection={solanaConnection}
        />
      )}

      {(activeWallet === "metamask" || activeWallet === "coinbase") && ethereumConnected && (
        <Card className="bg-[#fbf3de] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
          <h2 className="text-xl font-bold font-mono mb-4">ETHEREUM SUPPORT COMING SOON</h2>
          <p>Mutable is currently only available on Solana. Ethereum integration is coming soon!</p>
        </Card>
      )}
    </div>
  )
}
