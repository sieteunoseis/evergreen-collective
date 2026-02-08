import { useState, useEffect, useCallback } from 'react'

// BeforeInstallPromptEvent is not in standard TypeScript types
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isDesktopStandalone, setIsDesktopStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as { standalone?: boolean }).standalone === true
    setIsInstalled(isStandalone)

    // Detect desktop standalone mode (no touch, standalone, and has safe-area of 0)
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    setIsDesktopStandalone(isStandalone && !isMobile)

    // Detect iOS for manual instructions
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream
    setIsIOS(iOS)

    // Listen for the install prompt event (Android/Chrome)
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault() // Prevent the default browser prompt
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false

    try {
      await installPrompt.prompt()
      const result = await installPrompt.userChoice

      if (result.outcome === 'accepted') {
        setInstallPrompt(null)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [installPrompt])

  // Can show install prompt if not installed and (has prompt OR is iOS)
  const canInstall = !isInstalled && (installPrompt !== null || isIOS)

  return {
    canInstall,
    isInstalled,
    isIOS,
    isDesktopStandalone,
    promptInstall,
  }
}
