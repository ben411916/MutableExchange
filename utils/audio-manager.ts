// Audio Manager for handling game sounds

// Define sound types
export type SoundType =
  | "coin"
  | "bow-draw"
  | "bow-release"
  | "bow-full-draw"
  | "special-attack"
  | "hit"
  | "death"
  | "pickup"
  | "intro"

// Audio Manager class
export class AudioManager {
  private static instance: AudioManager
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private fallbackSounds: Map<string, HTMLAudioElement> = new Map()
  private muted = true // Start muted by default
  private audioDisabled = false // Disable audio completely to prevent errors
  private volume = 0.5
  private initialized = false
  private audioContext: AudioContext | null = null

  // Get singleton instance
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  // Initialize audio
  public init(): void {
    if (this.initialized || this.audioDisabled) return

    try {
      // Create audio context
      this.audioContext = new AudioContext()

      // Load primary sounds
      this.loadSound("coin1", "/sounds/coin1.mp3")
      this.loadSound("coin2", "/sounds/coin2.mp3")
      this.loadSound("coin3", "/sounds/coin3.mp3")
      this.loadSound("coin4", "/sounds/coin4.mp3")
      this.loadSound("bow-draw", "/sounds/bow-draw.mp3")
      this.loadSound("bow-release", "/sounds/bow-release.mp3")
      this.loadSound("bow-full-draw", "/sounds/bow-full-draw.mp3")
      this.loadSound("special-attack", "/sounds/special-attack.mp3")
      this.loadSound("intro", "/sounds/IntroAudio.mp3")

      // Load fallback sounds (simpler versions that are more likely to work)
      this.loadFallbackSound("coin", "/sounds/coin1.mp3")
      this.loadFallbackSound("bow-draw", "/sounds/bow-draw.mp3")
      this.loadFallbackSound("bow-release", "/sounds/bow-release.mp3")
      this.loadFallbackSound("bow-full-draw", "/sounds/bow-draw.mp3")
      this.loadFallbackSound("special-attack", "/sounds/special-attack.mp3")

      this.initialized = true
      console.log("Audio manager initialized")
    } catch (error) {
      console.error("Error initializing audio manager:", error)
      this.audioDisabled = true // Disable audio if initialization fails
    }
  }

  // Load a sound
  private async loadSound(id: string, url: string): Promise<void> {
    if (this.audioDisabled) return

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)

      this.sounds.set(id, this.createAudioElement(audioBuffer))
    } catch (error) {
      console.error(`Failed to load sound ${id}:`, error)
    }
  }

  // Load a fallback sound
  private async loadFallbackSound(id: string, url: string): Promise<void> {
    if (this.audioDisabled) return

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)

      this.fallbackSounds.set(id, this.createAudioElement(audioBuffer))
    } catch (error) {
      console.error(`Failed to load fallback sound ${id}:`, error)
    }
  }

  private createAudioElement(buffer: AudioBuffer): HTMLAudioElement {
    const audioElement = document.createElement("audio")
    audioElement.muted = this.muted
    return audioElement
  }

  // Play a sound
  public playSound(type: SoundType): void {
    if (this.muted || this.audioDisabled) return

    try {
      let sound: HTMLAudioElement | undefined

      // Select appropriate sound based on type
      switch (type) {
        case "coin":
          // Randomly select one of the coin sounds
          const coinIndex = Math.floor(Math.random() * 4) + 1
          sound = this.sounds.get(`coin${coinIndex}`)
          break
        default:
          sound = this.sounds.get(type)
          break
      }

      // If primary sound not found or failed, try fallback
      if (!sound) {
        console.warn(`Failed to find primary sound ${type}, trying fallback`)
        sound = this.fallbackSounds.get(type)
      }

      if (sound) {
        // Clone the audio to allow overlapping sounds
        const soundClone = sound.cloneNode() as HTMLAudioElement
        soundClone.volume = this.volume
        soundClone.play().catch((error) => {
          console.error(`Failed to play sound ${type}:`, error)
        })
      } else {
        console.warn(`Sound not found: ${type}`)
      }
    } catch (error) {
      console.error(`Error playing sound ${type}:`, error)
    }
  }

  // Toggle mute
  public toggleMute(): boolean {
    if (this.audioDisabled) return true

    this.muted = !this.muted
    this.sounds.forEach((sound) => {
      sound.muted = this.muted
    })
    this.fallbackSounds.forEach((sound) => {
      sound.muted = this.muted
    })
    return this.muted
  }

  // Set mute state
  public setMuted(muted: boolean): void {
    if (this.audioDisabled) return

    this.muted = muted
    this.sounds.forEach((sound) => {
      sound.muted = this.muted
    })
    this.fallbackSounds.forEach((sound) => {
      sound.muted = this.muted
    })
  }

  // Get mute state
  public isSoundMuted(): boolean {
    return this.muted || this.audioDisabled
  }

  // Set volume (0.0 to 1.0)
  public setVolume(volume: number): void {
    if (this.audioDisabled) return

    this.volume = Math.max(0, Math.min(1, volume))

    // Update volume for all loaded sounds
    this.sounds.forEach((sound) => {
      sound.volume = this.volume
    })

    this.fallbackSounds.forEach((sound) => {
      sound.volume = this.volume
    })
  }

  // Get current volume
  public getVolume(): number {
    return this.volume
  }

  // Check if audio is disabled
  public isAudioDisabled(): boolean {
    return this.audioDisabled
  }

  // Enable or disable audio completely
  public setAudioDisabled(disabled: boolean): void {
    this.audioDisabled = disabled
    if (!disabled && !this.initialized) {
      this.init()
    }
  }

  public resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume().catch((error) => {
        console.error("Failed to resume audio context:", error)
      })
    }
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance()

// Helper functions to play specific sounds
export const playRandomCoinSound = (): void => {
  audioManager.playSound("coin")
}

export const playBowDrawSound = (): void => {
  audioManager.playSound("bow-draw")
}

export const playBowReleaseSound = (): void => {
  audioManager.playSound("bow-release")
}

export const playBowFullDrawSound = (): void => {
  audioManager.playSound("bow-full-draw")
}

export const playSpecialAttackSound = (): void => {
  audioManager.playSound("special-attack")
}

export const playIntroSound = (): void => {
  audioManager.playSound("intro")
}

// Initialize audio
export const initializeAudio = (): void => {
  audioManager.init()
}

// Load audio files
export const loadAudioFiles = async (): Promise<void> => {
  if (audioManager.isAudioDisabled()) return

  try {
    // Load all sounds
    await Promise.all([
      audioManager.loadSound("coin1", "/sounds/coin1.mp3"),
      audioManager.loadSound("coin2", "/sounds/coin2.mp3"),
      audioManager.loadSound("coin3", "/sounds/coin3.mp3"),
      audioManager.loadSound("coin4", "/sounds/coin4.mp3"),
      audioManager.loadSound("bow-draw", "/sounds/bow-draw.mp3"),
      audioManager.loadSound("bow-release", "/sounds/bow-release.mp3"),
      audioManager.loadSound("bow-full-draw", "/sounds/bow-full-draw.mp3"),
      audioManager.loadSound("special-attack", "/sounds/special-attack.mp3"),
      audioManager.loadSound("intro", "/sounds/IntroAudio.mp3"),
    ])
    console.log("All audio files loaded successfully")
  } catch (error) {
    console.error("Error loading audio files:", error)
  }
}
