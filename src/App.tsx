import { useState, useEffect, useCallback } from 'react'
import type { Background } from '@/lib/constants'
import { SCREEN_DIMENSIONS } from '@/lib/constants'
import { BackgroundPicker } from '@/components/BackgroundPicker'
import { useSchedule } from '@/hooks/useSchedule'
import { useImageExport } from '@/hooks/useImageExport'

function App() {
  const { fixtures, loading } = useSchedule()
  const { exporting, imageDataUrl, shareSuccess, debugLog, exportImage, clearImage, clearShareSuccess } = useImageExport()
  const [isMobile, setIsMobile] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const { width, height } = SCREEN_DIMENSIONS.proMax

  const handleSelectBackground = async (background: Background) => {
    // Always show preview first (skipShare = true)
    await exportImage(background.fullRes, fixtures, width, height, true)
  }

  // Convert dataUrl to blob for sharing
  useEffect(() => {
    if (!imageDataUrl) {
      setImageBlob(null)
      return
    }
    fetch(imageDataUrl)
      .then(res => res.blob())
      .then(setImageBlob)
      .catch(() => setImageBlob(null))
  }, [imageDataUrl])

  // Debug log helper
  const log = (msg: string) => {
    if (!import.meta.env.VITE_DEBUG) return
    fetch('http://192.168.40.140:3001/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `[App] ${msg}` }),
    }).catch(() => {})
  }

  // Mobile save handler - triggers native share sheet
  const handleSaveToPhotos = useCallback(async () => {
    log(`handleSaveToPhotos called, imageBlob: ${imageBlob ? 'exists' : 'null'}, imageDataUrl: ${imageDataUrl ? 'exists' : 'null'}`)

    // If imageBlob isn't ready, create it from imageDataUrl
    let blobToShare = imageBlob
    if (!blobToShare && imageDataUrl) {
      log('Creating blob from imageDataUrl...')
      try {
        const res = await fetch(imageDataUrl)
        blobToShare = await res.blob()
        log(`Blob created: ${blobToShare.size} bytes`)
      } catch (err) {
        log(`Failed to create blob: ${err}`)
        return
      }
    }

    if (!blobToShare) {
      log('No blob available, returning')
      return
    }

    const file = new File([blobToShare], 'timbers-wallpaper.png', { type: 'image/png' })
    log(`File created: ${file.size} bytes`)

    const canShare = navigator.canShare?.({ files: [file] })
    log(`navigator.canShare: ${canShare}, navigator.share: ${!!navigator.share}`)

    if (canShare) {
      log('Attempting navigator.share...')
      try {
        await navigator.share({ files: [file] })
        log('Share completed!')
        setDownloaded(true)
      } catch (err) {
        log(`Share error: ${err instanceof Error ? err.message : String(err)}`)
        // User cancelled - do nothing
      }
    } else {
      log('canShare is false, using download fallback')
      // Fallback: trigger download
      const link = document.createElement('a')
      link.href = imageDataUrl!
      link.download = 'timbers-wallpaper.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setDownloaded(true)
      log('Download link clicked')
    }
  }, [imageBlob, imageDataUrl])

  // Desktop download handler
  const handleDownload = () => {
    if (!imageDataUrl) return
    const link = document.createElement('a')
    link.href = imageDataUrl
    link.download = 'timbers-wallpaper.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setDownloaded(true)
  }

  // Reset state when closing
  const handleClose = () => {
    setDownloaded(false)
    setImageBlob(null)
    clearImage()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-muted-foreground text-sm">Loading schedule...</div>
      </div>
    )
  }

  return (
    <>
      <BackgroundPicker onSelect={handleSelectBackground} exporting={exporting} />

      {/* Image preview modal - z-[60] to be above tabs (z-50) and status bar bg (z-40) */}
      {imageDataUrl && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col">
          {/* Status bar background */}
          <div
            className="bg-logo-green"
            style={{ height: 'max(env(safe-area-inset-top), 20px)' }}
          />

          {/* Tab shape matching main page - collapsed state */}
          <div className="relative" style={{ marginTop: '-6px' }}>
            {/* Main tab shape */}
            <svg
              className="w-full block"
              viewBox="0 0 400 100"
              preserveAspectRatio="none"
              style={{ height: '90px' }}
            >
              <rect x="0" y="0" width="400" height="2" fill="#597B59" />
              <path
                d="M0,0 L0,8 L60,8 Q75,8 82,25 L92,50 Q100,70 120,70 L280,70 Q300,70 308,50 L318,25 Q325,8 340,8 L400,8 L400,0 Z"
                fill="#597B59"
              />
            </svg>

            {/* Logo and text positioned over the center bulge */}
            <div
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3"
              style={{ bottom: '32px' }}
            >
              <img
                src="/logo/logo-color.png"
                alt="Evergreen Collective"
                className="h-12 w-12 object-contain"
              />
              <div className="flex flex-col">
                <span
                  className="text-white text-lg tracking-tight leading-tight font-bold"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Evergreen
                </span>
                <span
                  className="text-white/80 text-sm font-light leading-tight"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Collective
                </span>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            {/* Header text */}
            <div className="text-center mb-6 shrink-0">
              {downloaded ? (
                <>
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-logo-green/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-logo-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2
                    className="text-foreground text-xl font-bold mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {isMobile ? 'Saved!' : 'Downloaded!'}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {isMobile ? 'Check your Photos app' : 'Check your Downloads folder'}
                  </p>
                </>
              ) : (
                <>
                  <h2
                    className="text-foreground text-xl font-bold mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Your Wallpaper is Ready!
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Tap below to save to your device
                  </p>
                </>
              )}
            </div>

            {/* Phone frame with image */}
            <div className="relative">
              {/* Subtle glow effect behind phone */}
              <div className="absolute inset-0 bg-logo-green/10 blur-3xl rounded-full scale-150 pointer-events-none" />
              {/* Phone frame */}
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-border">
                <img
                  src={imageDataUrl}
                  alt="Timbers Wallpaper"
                  className="max-h-[50vh] w-auto pointer-events-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              {downloaded ? (
                <button
                  onClick={handleClose}
                  className="py-3 px-8 rounded-full bg-logo-green text-white font-medium shadow-lg"
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    onClick={isMobile ? handleSaveToPhotos : handleDownload}
                    className="py-3 px-8 rounded-full bg-logo-green text-white font-medium shadow-lg"
                  >
                    {isMobile ? 'Save to Photos' : 'Download Wallpaper'}
                  </button>
                  <button
                    onClick={handleClose}
                    className="py-3 px-8 rounded-full bg-muted text-muted-foreground font-medium"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Debug overlay - only shown when VITE_DEBUG is set */}
      {import.meta.env.VITE_DEBUG && debugLog.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-black/90 text-green-400 text-xs font-mono p-3 max-h-[40vh] overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-bold">Debug Log</span>
          </div>
          {debugLog.map((line, i) => (
            <div key={`export-${i}`} className="py-0.5">{line}</div>
          ))}
        </div>
      )}

      {/* Success toast for native share */}
      {shareSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={clearShareSuccess}
        >
          <div className="bg-card rounded-2xl px-8 py-6 mx-6 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-logo-green/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-logo-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Saved!</h3>
            <p className="text-muted-foreground text-sm mb-4">Check your Photos app</p>
            <button
              onClick={clearShareSuccess}
              className="py-2 px-6 rounded-full bg-gradient-to-r from-accent-green to-accent-green-dark text-white font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default App
