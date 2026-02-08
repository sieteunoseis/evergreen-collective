import { useState, useEffect, useCallback, useRef } from 'react'
import type { Background } from '@/lib/constants'
import { getBackgroundUrl } from '@/lib/constants'
import { BackgroundPicker } from '@/components/BackgroundPicker'
import { useSchedule } from '@/hooks/useSchedule'
import { useImageExport } from '@/hooks/useImageExport'
import { useDeviceResolution } from '@/hooks/useDeviceResolution'

// Log browser/platform info on load (only when VITE_DEBUG is set)
if (typeof window !== 'undefined' && import.meta.env.VITE_DEBUG) {
  const ua = navigator.userAgent
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as { standalone?: boolean }).standalone === true
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  console.log('%c Evergreen Collective ', 'background: #004F30; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;')
  console.log('Platform Info:')
  console.log('  User Agent:', ua)
  console.log('  Standalone PWA:', isStandalone)
  console.log('  Touch Device:', isMobile)
  console.log('  Screen:', `${window.screen.width}x${window.screen.height} @ ${window.devicePixelRatio}x`)
  console.log('  Viewport:', `${window.innerWidth}x${window.innerHeight}`)
}

function App() {
  const { fixtures, loading } = useSchedule()
  const { exporting, imageDataUrl, shareSuccess, debugLog, exportImage, clearImage, clearShareSuccess } = useImageExport()
  const deviceResolution = useDeviceResolution()
  const [isMobile, setIsMobile] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const lastTouchRef = useRef<{ distance: number; x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Prevent body scroll when preview modal is open
  useEffect(() => {
    if (imageDataUrl) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [imageDataUrl])

  const handleSelectBackground = async (background: Background) => {
    // Get the appropriate resolution background URL for this device
    const backgroundUrl = getBackgroundUrl(background.file, deviceResolution.suffix)
    const { width, height } = deviceResolution

    // Always show preview first (skipShare = true)
    await exportImage(backgroundUrl, fixtures, width, height, true)
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
    setIsZoomed(false)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    clearImage()
  }

  // Pinch to zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      lastTouchRef.current = { distance, x: centerX, y: centerY }
    } else if (e.touches.length === 1 && scale > 1) {
      lastTouchRef.current = { distance: 0, x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchRef.current) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const newScale = Math.min(Math.max(scale * (distance / lastTouchRef.current.distance), 1), 4)
      setScale(newScale)
      lastTouchRef.current.distance = distance
    } else if (e.touches.length === 1 && lastTouchRef.current && scale > 1) {
      const deltaX = e.touches[0].clientX - lastTouchRef.current.x
      const deltaY = e.touches[0].clientY - lastTouchRef.current.y
      setPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }))
      lastTouchRef.current = { distance: 0, x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }

  const handleTouchEnd = () => {
    lastTouchRef.current = null
    if (scale <= 1.1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }

  const toggleZoom = () => {
    if (isZoomed) {
      setIsZoomed(false)
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setIsZoomed(true)
    }
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
          <div className="flex-1 flex items-center justify-center p-4">
            {/* Preview with side buttons */}
            <div className="relative flex items-center justify-center max-h-full">
              {/* Stacked buttons - positioned absolutely to the left */}
              <div className="absolute right-full mr-3 flex flex-col gap-3">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="w-11 h-11 rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center shadow-lg"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Download/Done button */}
                {downloaded ? (
                  <button
                    onClick={handleClose}
                    className="w-11 h-11 rounded-full bg-logo-green flex items-center justify-center shadow-lg"
                    aria-label="Done"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={isMobile ? handleSaveToPhotos : handleDownload}
                    className="w-11 h-11 rounded-full bg-logo-green flex items-center justify-center shadow-lg"
                    aria-label={isMobile ? 'Save to Photos' : 'Download'}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                )}

              </div>

              {/* Phone frame with image */}
              <div
                className="relative rounded-[2.5rem] overflow-hidden cursor-zoom-in shrink"
                onClick={toggleZoom}
              >
                <img
                  src={imageDataUrl}
                  alt="Timbers Wallpaper"
                  className="max-h-[75vh] w-auto pointer-events-none"
                />
                {/* Resolution badge - centered */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 h-6 px-2 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-[10px] font-medium text-white whitespace-nowrap">
                    {deviceResolution.width}×{deviceResolution.height}
                  </span>
                </div>
                {/* Zoom hint */}
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </div>
                {/* Success indicator overlay */}
                {downloaded && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-4">
                      <svg className="w-10 h-10 text-logo-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fullscreen zoom overlay */}
            {isZoomed && (
              <div
                className="fixed inset-0 z-[70] bg-black flex items-center justify-center"
                ref={containerRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Close button */}
                <button
                  onClick={toggleZoom}
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                  style={{ top: 'calc(env(safe-area-inset-top, 20px) + 16px)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Zoom hint text */}
                <div className="absolute bottom-8 left-0 right-0 text-center text-white/60 text-sm">
                  Pinch to zoom • Drag to pan
                </div>

                {/* Zoomable image */}
                <img
                  src={imageDataUrl}
                  alt="Timbers Wallpaper"
                  className="max-w-full max-h-full object-contain transition-transform duration-100"
                  style={{
                    transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  }}
                  draggable={false}
                />
              </div>
            )}
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
