import MultiWalletConnector from "@/components/multi-wallet-connector"
import DemoWatermark from "@/components/demo-watermark"
import PromoWatermark from "@/components/promo-watermark"
import AudioPreloader from "@/components/audio-preloader"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 bg-[#fbf3de]">
      {/* Watermarks */}
      <div className="fixed top-0 left-0 w-full flex justify-between items-start p-2 z-50">
        <PromoWatermark />
        <DemoWatermark />
      </div>

      {/* Audio preloader component (client-side only) */}
      <AudioPreloader />

      <div className="w-full max-w-4xl pt-12 sm:pt-4">
        <MultiWalletConnector />
      </div>
    </main>
  )
}
