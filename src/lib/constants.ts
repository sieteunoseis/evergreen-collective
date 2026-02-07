// Portland Timbers brand colors
export const TIMBERS_GREEN = '#004F30'
export const TIMBERS_GOLD = '#EBE4D3'
export const TIMBERS_DARK = '#00261A'

// SportMonks Team ID for Portland Timbers
export const TIMBERS_TEAM_ID = 1977

// iPhone lock screen dimensions
export const SCREEN_DIMENSIONS = {
  // iPhone 14 Pro Max / 15 Pro Max / 16 Pro Max
  proMax: { width: 1290, height: 2796 },
  // iPhone 14 Pro / 15 Pro / 16 Pro
  pro: { width: 1179, height: 2556 },
} as const

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
  thumbnail: string
  fullRes: string
  credit?: string
}

// Available backgrounds
export const BACKGROUNDS: Background[] = [
  {
    id: 'bg-1',
    name: 'Timbers Logo',
    thumbnail: '/backgrounds/background-1.jpg',
    fullRes: '/backgrounds/background-1.jpg',
  },
  {
    id: 'bg-2',
    name: 'Hold Your Ground',
    thumbnail: '/backgrounds/background-2.jpg',
    fullRes: '/backgrounds/background-2.jpg',
  },
  {
    id: 'bg-3',
    name: 'Safe Zones Guide',
    thumbnail: '/backgrounds/iphone-safe-zones-wallpaper.png',
    fullRes: '/backgrounds/iphone-safe-zones-wallpaper.png',
  },
  {
    id: 'bg-4',
    name: 'Layout Wireframe',
    thumbnail: '/backgrounds/iphone-wallpaper-wireframe.png',
    fullRes: '/backgrounds/iphone-wallpaper-wireframe.png',
  },
  {
    id: 'bg-5',
    name: 'Morton Salt',
    thumbnail: '/backgrounds/morton-salt.png',
    fullRes: '/backgrounds/morton-salt.png',
  },
  {
    id: 'bg-6',
    name: 'Timber Jim',
    thumbnail: '/backgrounds/timber-jim.png',
    fullRes: '/backgrounds/timber-jim.png',
  },
  {
    id: 'bg-7',
    name: '2016 Jersey',
    thumbnail: '/backgrounds/2016-portland-timbers-jersey.jpg',
    fullRes: '/backgrounds/2016-portland-timbers-jersey.jpg',
  },
  {
    id: 'bg-8',
    name: 'Timbers City',
    thumbnail: '/backgrounds/timbers_city.png',
    fullRes: '/backgrounds/timbers_city.png',
  },
]
