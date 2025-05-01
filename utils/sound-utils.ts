// Sound utility for playing audio effects

// Preload audio files
const audioCache: Record<string, HTMLAudioElement> = {}
let audioInitialized = false

// Available sounds
export const SOUNDS = {
  INTRO: "/sounds/IntroAudio.mp3",
  COIN_1: "/sounds/coin1.mp3",
  COIN_2: "/sounds/coin2.mp3",
  COIN_3: "/sounds/coin3.mp3",
  COIN_4: "/sounds/coin4.mp3",
}

// Initialize audio (should be called after user interaction)
export const initializeAudio = () => {
  if (audioInitialized) return

  try {
    // Preload all sounds
    Object.values(SOUNDS).forEach((soundPath) => {
      const audio = new Audio(soundPath)
      audio.preload = "auto"
      audioCache[soundPath] = audio
    })

    audioInitialized = true
  } catch (error) {
    console.error("Failed to initialize audio:", error)
  }
}

// Play a specific sound
export const playSound = (soundPath: string, volume = 1.0) => {
  if (!audioInitialized) {
    initializeAudio()
  }

  try {
    // Create a new instance to allow overlapping sounds
    const sound = audioCache[soundPath] ? (audioCache[soundPath].cloneNode() as HTMLAudioElement) : new Audio(soundPath)

    sound.volume = volume
    sound.play().catch((err) => {
      // Often browsers block autoplay until user interaction
      console.warn("Could not play sound:", err)
    })
  } catch (error) {
    console.error("Error playing sound:", error)
  }
}

// Play intro sound
export const playIntroSound = () => {
  playSound(SOUNDS.INTRO, 0.7)
}

// Play a random coin sound
export const playRandomCoinSound = () => {
  const coinSounds = [SOUNDS.COIN_1, SOUNDS.COIN_2, SOUNDS.COIN_3, SOUNDS.COIN_4]

  const randomIndex = Math.floor(Math.random() * coinSounds.length)
  playSound(coinSounds[randomIndex], 0.5)
}
