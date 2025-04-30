import PhantomWalletConnector from "@/components/phantom-wallet-connector"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <PhantomWalletConnector />
      </div>
    </main>
  )
}
