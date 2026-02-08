import { useState, useEffect } from 'react'
import { getOptimalScreenDimension, type ScreenDimension, SCREEN_DIMENSIONS } from '@/lib/constants'

/**
 * Hook to detect and return the optimal screen resolution for wallpaper generation
 * Based on device pixel ratio and screen dimensions
 */
export function useDeviceResolution() {
  const [dimension, setDimension] = useState<ScreenDimension>(SCREEN_DIMENSIONS.proMax)

  useEffect(() => {
    setDimension(getOptimalScreenDimension())

    // Log for debugging
    if (import.meta.env.VITE_DEBUG) {
      const d = getOptimalScreenDimension()
      console.log('Device Resolution Detection:')
      console.log('  Screen:', `${window.screen.width}x${window.screen.height}`)
      console.log('  DPR:', window.devicePixelRatio)
      console.log('  Effective:', `${window.screen.width * window.devicePixelRatio}x${window.screen.height * window.devicePixelRatio}`)
      console.log('  Selected:', `${d.width}x${d.height} (${d.suffix})`)
    }
  }, [])

  return dimension
}
