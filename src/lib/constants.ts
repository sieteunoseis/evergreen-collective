// Re-export brand colors for backward compatibility
export { BRAND_PRIMARY as TIMBERS_GREEN, BRAND_GOLD as TIMBERS_GOLD, BRAND_DARK as TIMBERS_DARK } from './brand'

// SportMonks Team ID for Portland Timbers
export const TIMBERS_TEAM_ID = 1977

// iPhone lock screen dimensions
export const SCREEN_DIMENSIONS = {
  // Standard / smaller iPhones
  standard: { width: 1024, height: 2219, suffix: '1024' },
  // iPhone 14 Pro / 15 Pro / 16 Pro
  pro: { width: 1179, height: 2556, suffix: '1179' },
  // iPhone 14 Pro Max / 15 Pro Max / 16 Pro Max
  proMax: { width: 1290, height: 2796, suffix: '1290' },
} as const

export type ScreenDimension = typeof SCREEN_DIMENSIONS[keyof typeof SCREEN_DIMENSIONS]

// Detect optimal screen dimensions based on device
export function getOptimalScreenDimension(): ScreenDimension {
  if (typeof window === 'undefined') return SCREEN_DIMENSIONS.proMax

  const screenWidth = window.screen.width * window.devicePixelRatio
  const screenHeight = window.screen.height * window.devicePixelRatio

  // Use the larger dimension (could be portrait or landscape)
  const maxDimension = Math.max(screenWidth, screenHeight)

  if (maxDimension >= 2796) {
    return SCREEN_DIMENSIONS.proMax
  } else if (maxDimension >= 2556) {
    return SCREEN_DIMENSIONS.pro
  } else {
    return SCREEN_DIMENSIONS.standard
  }
}

// Layout zones (as percentages of total height)
export const LAYOUT_ZONES = {
  clockStart: 0.15,    // iOS clock area starts
  clockEnd: 0.33,      // iOS clock area ends
  scheduleStart: 0.72, // Schedule overlay starts
  scheduleEnd: 0.90,   // Schedule overlay ends (dock zone below)
  dockStart: 0.90,     // iOS dock zone starts
} as const

// Fixture data type
export interface Fixture {
  id: number
  date: string        // "2026-03-15"
  time: string        // "19:30"
  opponent: string    // "LA Galaxy"
  opponentLogo?: string
  isHome: boolean
  venue: string
  competition: string // "MLS" or "US Open Cup" etc.
}

// Background image metadata
export interface Background {
  id: string
  name: string
  description: string
  designer: string
  /** Base file name without suffix (e.g., "morton-salt") */
  file: string
  thumbnail: string
  expiresAt: string | null
}

// Raw background data from JSON
interface BackgroundJson {
  id: string
  name: string
  description: string
  designer: string
  file: string
  expiresAt: string | null
}

// Get the full URL for a background at a specific resolution
export function getBackgroundUrl(file: string, suffix: string): string {
  return `/backgrounds/${file}_${suffix}.png`
}

// Transform JSON data to Background format
function transformBackground(bg: BackgroundJson): Background {
  return {
    id: bg.id,
    name: bg.name,
    description: bg.description,
    designer: bg.designer,
    file: bg.file,
    thumbnail: getBackgroundUrl(bg.file, 'thumb'),
    expiresAt: bg.expiresAt,
  }
}

// Filter out expired backgrounds
function isNotExpired(bg: Background): boolean {
  if (!bg.expiresAt) return true
  return new Date(bg.expiresAt) > new Date()
}

// Load backgrounds from JSON (cached)
let backgroundsCache: Background[] | null = null

export async function loadBackgrounds(): Promise<Background[]> {
  if (backgroundsCache) return backgroundsCache

  try {
    const response = await fetch('/backgrounds/backgrounds.json')
    const data = await response.json()
    const filtered = data.backgrounds
      .map(transformBackground)
      .filter(isNotExpired)
    backgroundsCache = filtered
    return filtered
  } catch {
    console.error('Failed to load backgrounds.json')
    return []
  }
}

// Fallback static backgrounds (used for initial render)
export const BACKGROUNDS: Background[] = []
