"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function PromoWatermark() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href="https://www.mutable.live/pre-register-mutb-tokens"
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed top-2 left-2 z-50 flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md transition-all duration-300 ${
        isHovered ? "bg-amber-500" : "bg-amber-400"
      } border border-amber-600 shadow-md`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered
          ? "linear-gradient(135deg, #f59f0b 0%, #fbbf24 50%, #f59f0b 100%)"
          : "linear-gradient(135deg, #fbbf24 0%, #f7e05b 50%, #fbbf24 100%)",
      }}
    >
      <div className="relative">
        <Image
          src="/images/mutable-token.png"
          alt="MUTB Token"
          width={16}
          height={16}
          className="rounded-full w-4 h-4 sm:w-6 sm:h-6"
        />
        {isHovered && (
          <Sparkles
            className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 text-yellow-300"
            style={{ filter: "drop-shadow(0 0 2px #fff)" }}
          />
        )}
      </div>
      <div className="font-bold text-[10px] sm:text-sm text-amber-900">
        Sign up and earn <span className="text-amber-800">50 free MUTB</span>
      </div>
      <Sparkles
        className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-300 hidden sm:block"
        style={{ filter: "drop-shadow(0 0 2px #fff)" }}
      />
    </Link>
  )
}
