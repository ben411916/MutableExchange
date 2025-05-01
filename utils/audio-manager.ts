// Audio manager for handling sound effects
class AudioManager {
  private static instance: AudioManager
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private isMuted = true // Start muted by default
  private isInitialized = false
  private soundsLoaded = false
  private failedSounds: Set<string> = new Set() // Track failed sounds

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Create audio context on user interaction
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.isInitialized = true
      console.log("Audio manager initialized")
    } catch (error) {
      console.error("Failed to initialize audio manager:", error)
    }
  }

  public async loadSounds(): Promise<void> {
    if (!this.audioContext || this.soundsLoaded) return

    try {
      // Load all sounds
      await Promise.allSettled([
        this.loadSound("intro", "/sounds/IntroAudio.mp3"),
        this.loadSound("coin1", "/sounds/coin1.mp3"),
        this.loadSound("coin2", "/sounds/coin2.mp3"),
        this.loadSound("coin3", "/sounds/coin3.mp3"),
        this.loadSound("coin4", "/sounds/coin4.mp3"),
      ])

      this.soundsLoaded = true
      console.log("Audio files loading completed")
    } catch (error) {
      console.error("Failed to load audio files:", error)
    }
  }

  private async loadSound(id: string, url: string): Promise<void> {
    if (!this.audioContext) return

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch sound ${id}: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()

      try {
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
        this.sounds.set(id, audioBuffer)
        console.log(`Sound ${id} loaded successfully`)
      } catch (decodeError) {
        console.error(`Failed to decode sound ${id}:`, decodeError)
        this.failedSounds.add(id)
      }
    } catch (error) {
      console.error(`Failed to load sound ${id}:`, error)
      this.failedSounds.add(id)
    }
  }

  public playSound(id: string): void {
    if (!this.audioContext || this.isMuted || !this.sounds.has(id) || this.failedSounds.has(id)) return

    try {
      const source = this.audioContext.createBufferSource()
      source.buffer = this.sounds.get(id)!
      source.connect(this.audioContext.destination)
      source.start(0)
    } catch (error) {
      console.error(`Failed to play sound ${id}:`, error)
    }
  }

  public playRandomCoinSound(): void {
    if (!this.soundsLoaded) return

    // Filter out failed sounds
    const availableCoinSounds = ["coin1", "coin2", "coin3", "coin4"].filter(
      (id) => this.sounds.has(id) && !this.failedSounds.has(id),
    )

    if (availableCoinSounds.length === 0) {
      console.warn("No available coin sounds to play")
      return
    }

    const randomIndex = Math.floor(Math.random() * availableCoinSounds.length)
    this.playSound(availableCoinSounds[randomIndex])
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted
    return this.isMuted
  }

  public isSoundMuted(): boolean {
    return this.isMuted
  }

  public resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume()
    }
  }
}

// Export a singleton instance
export const audioManager = AudioManager.getInstance()

// Helper function to play a random coin sound
export function playRandomCoinSound() {
  audioManager.playRandomCoinSound()
}

// Helper function to play the intro sound
export function playIntroSound() {
  audioManager.playSound("intro")
}

// Helper function to initialize audio system
export async function initializeAudio() {
  await audioManager.initialize()
}

// Helper function to load audio files
export async function loadAudioFiles() {
  await audioManager.loadSounds()
}
