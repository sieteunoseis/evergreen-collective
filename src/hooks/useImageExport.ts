import { useCallback, useState } from 'react'

interface FixtureData {
  id: number
  date: string
  time: string
  opponent: string
  opponentLogo?: string
  isHome: boolean
}

interface UseImageExportResult {
  exporting: boolean
  error: string | null
  imageDataUrl: string | null
  shareSuccess: boolean
  debugLog: string[]
  exportImage: (
    backgroundSrc: string,
    fixtures: FixtureData[],
    width: number,
    height: number,
    skipShare?: boolean
  ) => Promise<void>
  clearImage: () => void
  clearShareSuccess: () => void
}

export function useImageExport(): UseImageExportResult {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [shareSuccess, setShareSuccess] = useState(false)
  const [debugLog, setDebugLog] = useState<string[]>([])

  const log = (msg: string) => {
    if (!import.meta.env.VITE_DEBUG) return
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])
    // Send to log server
    fetch('http://192.168.40.140:3001/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    }).catch(() => {})
  }

  const clearImage = useCallback(() => {
    setImageDataUrl(null)
  }, [])

  const clearShareSuccess = useCallback(() => {
    setShareSuccess(false)
  }, [])

  const exportImage = useCallback(
    async (
      backgroundSrc: string,
      fixtures: FixtureData[],
      width: number,
      height: number,
      skipShare = false
    ) => {
      setExporting(true)
      setError(null)
      setImageDataUrl(null)
      setShareSuccess(false)
      setDebugLog([])
      log('Starting export...')

      // Track start time for minimum loading duration
      const startTime = Date.now()
      const MIN_LOADING_MS = 800

      try {
        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          throw new Error('Could not get canvas context')
        }

        // Load and draw background image
        const bgImage = new Image()
        bgImage.crossOrigin = 'anonymous'

        await new Promise<void>((resolve, reject) => {
          bgImage.onload = () => resolve()
          bgImage.onerror = () => reject(new Error('Failed to load background'))
          bgImage.src = backgroundSrc
        })

        // Draw background (cover)
        const scale = Math.max(width / bgImage.width, height / bgImage.height)
        const scaledWidth = bgImage.width * scale
        const scaledHeight = bgImage.height * scale
        const offsetX = (width - scaledWidth) / 2
        const offsetY = (height - scaledHeight) / 2
        ctx.drawImage(bgImage, offsetX, offsetY, scaledWidth, scaledHeight)

        // Draw fixtures horizontally with logos (no background)
        const displayFixtures = fixtures.slice(0, 5)
        const logoSize = 180
        const logoGap = 32
        const totalLogosWidth = displayFixtures.length * logoSize + (displayFixtures.length - 1) * logoGap
        const startX = (width - totalLogosWidth) / 2 + logoSize / 2
        const logoY = height * 0.78

        // Load all logos first
        const logoImages = await Promise.all(
          displayFixtures.map(async (fixture) => {
            if (!fixture.opponentLogo) return null
            try {
              const img = new Image()
              img.crossOrigin = 'anonymous'
              await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve()
                img.onerror = () => reject()
                img.src = fixture.opponentLogo!
              })
              return img
            } catch {
              return null
            }
          })
        )

        displayFixtures.forEach((fixture, index) => {
          const centerX = startX + index * (logoSize + logoGap)

          // Draw logo or placeholder circle
          const logoImg = logoImages[index]
          if (logoImg) {
            ctx.drawImage(
              logoImg,
              centerX - logoSize / 2,
              logoY - logoSize / 2,
              logoSize,
              logoSize
            )
          } else {
            // Placeholder circle with opponent initial
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.beginPath()
            ctx.arc(centerX, logoY, logoSize / 2, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = 'white'
            ctx.font = 'bold 56px system-ui, -apple-system, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(fixture.opponent.charAt(0), centerX, logoY)
          }

          // Date (short format: 3/1) - bold for home, italic for away
          ctx.fillStyle = 'white'
          ctx.font = fixture.isHome
            ? 'bold 32px system-ui, -apple-system, sans-serif'
            : 'italic 32px system-ui, -apple-system, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(formatShortDate(fixture.date), centerX, logoY + logoSize / 2 + 28)
        })

        // Convert to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b)
              else reject(new Error('Failed to create blob'))
            },
            'image/png',
            1
          )
        })

        // Create file for sharing
        const file = new File([blob], 'timbers-wallpaper.png', {
          type: 'image/png',
        })

        // Try Web Share API first (only on mobile)
        log(`skipShare: ${skipShare}`)
        log(`navigator.share exists: ${!!navigator.share}`)
        log(`navigator.canShare exists: ${!!navigator.canShare}`)

        const canShareFiles = navigator.canShare?.({ files: [file] })
        log(`canShare with file: ${canShareFiles}`)

        if (!skipShare && canShareFiles) {
          log('Attempting navigator.share...')
          try {
            await navigator.share({ files: [file] })
            // Share completed successfully (user chose an action like Save Image)
            log('Share completed successfully!')
            setShareSuccess(true)
            return
          } catch (shareErr) {
            log(`Share error: ${shareErr instanceof Error ? `${shareErr.name}: ${shareErr.message}` : String(shareErr)}`)
            if (shareErr instanceof Error && shareErr.name === 'AbortError') {
              // User cancelled the share sheet
              log('User cancelled share sheet')
              return
            }
            log('Non-abort error, falling through to image preview')
          }
        } else {
          log('Skipping share, showing image preview')
        }

        // Show image preview (for mobile long-press save or desktop download)
        const dataUrl = canvas.toDataURL('image/png')

        // Ensure minimum loading time for smooth UX
        const elapsed = Date.now() - startTime
        if (elapsed < MIN_LOADING_MS) {
          await new Promise(resolve => setTimeout(resolve, MIN_LOADING_MS - elapsed))
        }

        setImageDataUrl(dataUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to export image')
      } finally {
        setExporting(false)
      }
    },
    []
  )

  return {
    exporting,
    error,
    imageDataUrl,
    shareSuccess,
    debugLog,
    exportImage,
    clearImage,
    clearShareSuccess,
  }
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}
