import type { Background, Fixture } from '@/lib/constants'
import { SCREEN_DIMENSIONS } from '@/lib/constants'
import { ScheduleOverlay } from './ScheduleOverlay'
import { useImageExport } from '@/hooks/useImageExport'

interface WallpaperEditorProps {
  background: Background
  fixtures: Fixture[]
  onBack: () => void
}

export function WallpaperEditor({
  background,
  fixtures,
  onBack,
}: WallpaperEditorProps) {
  const { exporting, error, imageDataUrl, exportImage, clearImage } = useImageExport()

  // Use Pro Max dimensions for export
  const { width, height } = SCREEN_DIMENSIONS.proMax

  const handleSave = async () => {
    await exportImage(background.fullRes, fixtures, width, height)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-accent-pink font-medium"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-base font-semibold text-gray-900">Preview</h1>
          <div className="w-14" />
        </div>
      </div>

      {/* Phone Preview */}
      <div className="px-6 py-8">
        <div className="max-w-xs mx-auto">
          {/* iPhone frame */}
          <div
            className="
              relative bg-gray-900 rounded-[3rem] p-3
              shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)]
              ring-1 ring-gray-800
            "
          >
            {/* Side buttons */}
            <div className="absolute -left-0.5 top-24 w-0.5 h-8 bg-gray-700 rounded-l" />
            <div className="absolute -left-0.5 top-36 w-0.5 h-12 bg-gray-700 rounded-l" />
            <div className="absolute -left-0.5 top-52 w-0.5 h-12 bg-gray-700 rounded-l" />
            <div className="absolute -right-0.5 top-32 w-0.5 h-16 bg-gray-700 rounded-r" />

            {/* Screen */}
            <div className="relative bg-black rounded-[2.4rem] overflow-hidden">
              {/* Dynamic Island */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-20" />

              {/* Wallpaper preview */}
              <div
                className="relative w-full"
                style={{ aspectRatio: `${width} / ${height}` }}
              >
                <img
                  src={background.fullRes}
                  alt={background.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Mock iOS clock */}
                <div className="absolute top-[18%] inset-x-0 text-center z-10">
                  <div className="text-white text-5xl font-light tracking-tight drop-shadow-lg">
                    9:41
                  </div>
                  <div className="text-white/80 text-sm mt-1 drop-shadow">
                    Friday, March 1
                  </div>
                </div>

                <ScheduleOverlay fixtures={fixtures} />

                {/* Mock home indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download section */}
      <div className="px-6 pb-10">
        <div className="max-w-xs mx-auto space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Download button - iSpazio style gradient */}
          <button
            onClick={handleSave}
            disabled={exporting}
            className="
              w-full py-4 px-6 rounded-full
              bg-gradient-to-r from-[#ff4f72] to-[#e6194a]
              text-white font-semibold text-base uppercase tracking-wide
              shadow-lg shadow-accent-pink/30
              transition-all duration-200 ease-out
              hover:translate-y-[-2px] hover:shadow-xl hover:shadow-accent-pink/40
              active:translate-y-0 active:shadow-lg
              disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0
              flex items-center justify-center gap-2
            "
          >
            {exporting ? (
              <>
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Wallpaper
              </>
            )}
          </button>

          {/* Helper text */}
          <p className="text-gray-400 text-xs text-center">
            Save to Photos or share directly
          </p>
        </div>
      </div>

      {/* Image save modal - shown when Web Share API isn't available */}
      {imageDataUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm overflow-auto max-h-full py-8">
            <p className="text-white text-center mb-4 text-sm">
              Long press the image below and tap <strong>"Add to Photos"</strong>
            </p>
            <img
              src={imageDataUrl}
              alt="Timbers Wallpaper"
              className="w-full rounded-2xl shadow-2xl"
            />
            <button
              onClick={clearImage}
              className="mt-6 w-full py-3 px-6 rounded-full bg-white/20 text-white font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
