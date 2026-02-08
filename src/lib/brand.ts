// Centralized brand configuration
// Update these values once and they propagate throughout the app

export const BRAND = {
  name: 'Evergreen Barracks',
  shortName: 'Evergreen',
  description: 'Portland Timbers lock screen wallpapers with live schedule',
  logo: '/logo/eb-logo-color-1.png',

  colors: {
    primary: '#055032',      // Main brand green (theme color)
    headerGreen: '#055032',  // Header/tab background
    dark: '#00261A',         // Darker shade
    gold: '#EBE4D3',         // Accent gold
  },
} as const

// Export individual values for convenience
export const BRAND_PRIMARY = BRAND.colors.primary
export const BRAND_HEADER_GREEN = BRAND.colors.headerGreen
export const BRAND_DARK = BRAND.colors.dark
export const BRAND_GOLD = BRAND.colors.gold
export const BRAND_LOGO = BRAND.logo
export const BRAND_NAME = BRAND.name
