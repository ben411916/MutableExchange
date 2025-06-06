import MultiWalletConnector from "@/components/multi-wallet-connector"
import DemoWatermark from "@/components/demo-watermark"
import PromoWatermark from "@/components/promo-watermark"
import GlobalAudioControls from "@/components/global-audio-controls"

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#f5efdc]">
      <div className="max-w-6xl mx-auto">
        <MultiWalletConnector />
        <DemoWatermark />
        <PromoWatermark />
        <GlobalAudioControls />
      </div>
    </main>
  )
}
