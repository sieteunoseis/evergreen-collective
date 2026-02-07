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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-gray-400 text-sm">Loading schedule...</div>
      </div>
    )
  }

  return (
    <>
      <BackgroundPicker onSelect={handleSelectBackground} exporting={exporting} />

      {/* Image preview modal - z-[60] to be above tabs (z-50) and status bar bg (z-40) */}
      {imageDataUrl && (
        <div className="fixed inset-0 z-[60] bg-gradient-to-b from-black via-black/95 to-black flex flex-col items-center justify-center p-6">
          {/* Header text */}
          <div className="text-center mb-6 shrink-0">
            {downloaded ? (
              <>
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent-green/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2
                  className="text-white text-xl font-bold mb-1"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {isMobile ? 'Saved!' : 'Downloaded!'}
                </h2>
                <p className="text-white/60 text-sm">
                  {isMobile ? 'Check your Photos app' : 'Check your Downloads folder'}
                </p>
              </>
            ) : (
              <>
                <h2
                  className="text-white text-xl font-bold mb-1"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Your Wallpaper is Ready!
                </h2>
                <p className="text-white/60 text-sm">
                  Tap below to save to your device
                </p>
              </>
            )}
          </div>

          {/* Phone frame with image */}
          <div className="relative">
            {/* Subtle glow effect behind phone */}
            <div className="absolute inset-0 bg-logo-green/20 blur-3xl rounded-full scale-150 pointer-events-none" />
            {/* Phone frame */}
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
              <img
                src={imageDataUrl}
                alt="Timbers Wallpaper"
                className="max-h-[55vh] w-auto pointer-events-none"
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
                  className="py-3 px-8 rounded-full bg-white/20 text-white font-medium"
                >
                  Close
                </button>
              </>
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
          <div className="bg-white rounded-2xl px-8 py-6 mx-6 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Saved!</h3>
            <p className="text-gray-500 text-sm mb-4">Check your Photos app</p>
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
