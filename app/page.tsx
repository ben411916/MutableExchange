import MultiWalletConnector from "@/components/multi-wallet-connector"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 bg-[#fbf3de]">
      <div className="w-full max-w-4xl pt-4">
        <MultiWalletConnector />
      </div>
    </main>
  )
}
