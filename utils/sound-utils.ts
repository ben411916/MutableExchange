// Sound utility for playing audio effects

// Preload audio files
const audioCache: Record<string, HTMLAudioElement> = {}
let audioInitialized = false
let audioInitializationAttempted = false

// Available sounds
export const SOUNDS = {
  INTRO: "/sounds/IntroAudio.mp3",
  COIN_1: "/sounds/coin1.mp3",
  COIN_2: "/sounds/coin2.mp3",
  COIN_3: "/sounds/coin3.mp3",
  COIN_4: "/sounds/coin4.mp3",
}

// Check if audio file exists and is accessible
const checkAudioFile = async (path: string): Promise<boolean> => {
  try {
    const response = await fetch(path, { method: "HEAD" })
    return response.ok
  } catch (error) {
    console.error(`Error checking audio file ${path}:`, error)
    return false
  }
}

// Initialize audio (should be called after user interaction)
export const initializeAudio = async () => {
  if (audioInitialized || audioInitializationAttempted) return

  audioInitializationAttempted = true

  try {
    // Check if Web Audio API is supported
    if (typeof window === "undefined" || typeof Audio === "undefined") {
      console.warn("Audio is not supported in this environment")
      return
    }

    // Check if audio files exist before preloading
    for (const [key, soundPath] of Object.entries(SOUNDS)) {
      try {
        // Check if file exists
        const fileExists = await checkAudioFile(soundPath)
        if (!fileExists) {
          console.warn(`Audio file not found: ${soundPath}`)
          continue
        }

        const audio = new Audio()

        // Add event listeners for debugging
        audio.addEventListener("error", (e) => {
          console.warn(`Error loading audio ${soundPath}:`, e)
        })

        // Set source after adding event listeners
        audio.src = soundPath
        audio.preload = "auto"

        // Test loading the audio
        const canPlay = await new Promise<boolean>((resolve) => {
          const successHandler = () => {
            audio.removeEventListener("canplaythrough", successHandler)
            audio.removeEventListener("error", errorHandler)
            resolve(true)
          }

          const errorHandler = () => {
            audio.removeEventListener("canplaythrough", successHandler)
            audio.removeEventListener("error", errorHandler)
            resolve(false)
          }

          audio.addEventListener("canplaythrough", successHandler, { once: true })
          audio.addEventListener("error", errorHandler, { once: true })

          // Set a timeout in case the events don't fire
          setTimeout(() => {
            audio.removeEventListener("canplaythrough", successHandler)
            audio.removeEventListener("error", errorHandler)
            resolve(false)
          }, 3000)
        })

        if (canPlay) {
          audioCache[soundPath] = audio
          console.log(`Successfully loaded audio: ${soundPath}`)
        } else {
          console.warn(`Could not load audio: ${soundPath}`)
        }
      } catch (error) {
        console.error(`Failed to initialize audio ${soundPath}:`, error)
      }
    }

    audioInitialized = Object.keys(audioCache).length > 0

    if (!audioInitialized) {
      console.warn("No audio files could be loaded successfully")
    }
  } catch (error) {
    console.error("Failed to initialize audio:", error)
  }
}

// Play a specific sound
export const playSound = (soundPath: string, volume = 1.0) => {
  // If audio isn't initialized or the browser doesn't support audio, silently fail
  if (!audioInitialized || typeof window === "undefined" || typeof Audio === "undefined") {
    return
  }

  try {
    // Check if the sound is in the cache
    if (!audioCache[soundPath]) {
      console.warn(`Sound not loaded in cache: ${soundPath}`)
      return
    }

    // Create a new instance to allow overlapping sounds
    const sound = audioCache[soundPath].cloneNode() as HTMLAudioElement
    sound.volume = volume

    // Play with better error handling
    const playPromise = sound.play()

    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Could not play sound:", err)
      })
    }
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

  // Filter to only include sounds that are in the cache
  const availableSounds = coinSounds.filter((sound) => audioCache[sound])

  if (availableSounds.length === 0) {
    console.warn("No coin sounds available to play")
    return
  }

  const randomIndex = Math.floor(Math.random() * availableSounds.length)
  playSound(availableSounds[randomIndex], 0.5)
}

// Check if audio is supported and initialized
export const isAudioSupported = () => {
  return audioInitialized && typeof window !== "undefined" && typeof Audio !== "undefined"
}
