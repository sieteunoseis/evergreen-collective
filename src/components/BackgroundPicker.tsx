import { useEffect, useState, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { type Background } from '@/lib/constants'
import { useBackgrounds } from '@/hooks/useBackgrounds'
import { useTheme } from '@/hooks/useTheme'
import { usePWAInstall } from '@/hooks/usePWAInstall'

interface BackgroundPickerProps {
  onSelect: (background: Background) => void
  exporting?: boolean
}

// Format expiration date for display
function formatExpirationDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function BackgroundPicker({
  onSelect: onSelectBackground,
  exporting,
}: BackgroundPickerProps) {
  const { backgrounds, loading: backgroundsLoading } = useBackgrounds()
  const { theme, cycleTheme } = useTheme()
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall()
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [tabExpanded, setTabExpanded] = useState(false)
  const [bottomTabExpanded, setBottomTabExpanded] = useState(false)
  const [bottomTabVisible, setBottomTabVisible] = useState(false)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    skipSnaps: false,
    dragFree: false,
    startIndex: 0,
    containScroll: false, // Allow looping even when all slides fit
  })

  const onCarouselSelect = useCallback(() => {
    if (!emblaApi || backgrounds.length === 0) return
    // Map the carousel index back to the real background index
    const slideIndex = emblaApi.selectedScrollSnap()
    setSelectedIndex(slideIndex % backgrounds.length)
  }, [emblaApi, backgrounds.length])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onCarouselSelect)
    emblaApi.on('reInit', onCarouselSelect)
    return () => {
      emblaApi.off('select', onCarouselSelect)
      emblaApi.off('reInit', onCarouselSelect)
    }
  }, [emblaApi, onCarouselSelect])

  // Track page scroll to show/hide bottom tab
  useEffect(() => {
    const handlePageScroll = () => {
      const shouldShow = window.scrollY > 100
      setBottomTabVisible(shouldShow)
      if (!shouldShow) {
        setBottomTabExpanded(false)
      }
    }

    window.addEventListener('scroll', handlePageScroll, { passive: true })
    return () => window.removeEventListener('scroll', handlePageScroll)
  }, [])

  // Show loading state while backgrounds load
  if (backgroundsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-logo-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Status bar background - always visible to maintain green status bar */}
      <div
        className="fixed top-0 left-0 right-0 z-40 bg-logo-green"
        style={{ height: 'max(env(safe-area-inset-top), 20px)' }}
      />

      {/* Cover for slogan - hides "Rose City" until tab is expanded */}
      <div
        className="fixed top-0 left-0 right-0 z-[52] bg-logo-green transition-opacity duration-500 ease-out pointer-events-none"
        style={{
          height: 'max(env(safe-area-inset-top), 20px)',
          opacity: tabExpanded ? 0 : 1,
        }}
      />

      {/* Theme toggle - top right */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          cycleTheme()
        }}
        className="fixed z-[51] w-8 h-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground transition-all duration-500 ease-out"
        style={{
          top: tabExpanded
            ? isInstalled
              ? 'calc(max(env(safe-area-inset-top), 20px) + 140px)'
              : 'calc(max(env(safe-area-inset-top), 20px) + 100px)'
            : 'calc(max(env(safe-area-inset-top), 20px) + 12px)',
          right: '12px'
        }}
        aria-label={`Theme: ${theme}`}
      >
        {theme === 'system' && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )}
        {theme === 'light' && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
        {theme === 'dark' && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Install app button - top left */}
      {canInstall && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (isIOS) {
              setShowIOSInstructions(true)
            } else {
              promptInstall()
            }
          }}
          className="fixed z-[51] w-8 h-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground transition-all duration-500 ease-out"
          style={{
            top: tabExpanded
              ? isInstalled
                ? 'calc(max(env(safe-area-inset-top), 20px) + 140px)'
                : 'calc(max(env(safe-area-inset-top), 20px) + 100px)'
              : 'calc(max(env(safe-area-inset-top), 20px) + 12px)',
            left: '12px'
          }}
          aria-label="Install app"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
        </button>
      )}

      {/* iOS install instructions modal */}
      {showIOSInstructions && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            className="bg-card rounded-2xl p-6 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-logo-green/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-logo-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Add to Home Screen</h3>
            <p className="text-muted-foreground text-sm mb-4">
              To install this app on your iPhone:
            </p>
            <ol className="text-left text-sm text-muted-foreground space-y-3 mb-6">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-logo-green/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-logo-green font-bold text-xs">1</span>
                </span>
                <span>Tap the <strong className="text-foreground">Share</strong> button in Safari</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-logo-green/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-logo-green font-bold text-xs">2</span>
                </span>
                <span>Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-logo-green/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-logo-green font-bold text-xs">3</span>
                </span>
                <span>Tap <strong className="text-foreground">Add</strong> to confirm</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="py-2 px-6 rounded-full bg-logo-green text-white font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Tab-style navbar with center bulge */}
      <div
        className="fixed left-0 right-0 z-50 transition-all duration-500 ease-out pointer-events-none"
        style={{
          top: tabExpanded
            ? 'calc(max(env(safe-area-inset-top), 20px))'
            : isInstalled
              ? '-40px'
              : 'calc(max(env(safe-area-inset-top), 20px) - 45px)',
        }}
      >
        {/* Hidden slogan bar at top - full width green background */}
        <div
          className="bg-logo-green text-center py-1.5"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 6px)' }}
        >
          <span
            className="text-white text-base tracking-wide"
            style={{ fontFamily: "'Another Danger', cursive", display: 'inline-block', transform: 'translateY(-15px)' }}
          >
            🌹 Rose City Til I Die! 🪓
          </span>
        </div>

        {/* Main tab shape - only the path is filled, rest is transparent */}
        <svg
          className="w-full block"
          viewBox="0 0 400 100"
          preserveAspectRatio="none"
          style={{ height: '90px', marginTop: '-1px' }}
        >
          {/* Extended rectangle at top to connect with slogan bar */}
          <rect x="0" y="0" width="400" height="2" fill="#597B59" />
          <path
            d="M0,0 L0,8 L60,8 Q75,8 82,25 L92,50 Q100,70 120,70 L280,70 Q300,70 308,50 L318,25 Q325,8 340,8 L400,8 L400,0 Z"
            fill="#597B59"
          />
        </svg>

        {/* Clickable tab area - covers the center bulge portion */}
        <button
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 cursor-pointer pointer-events-auto bg-transparent border-none p-4"
          style={{ bottom: '16px' }}
          onClick={() => setTabExpanded(!tabExpanded)}
          aria-label={tabExpanded ? 'Collapse header' : 'Expand header'}
        >
          <img
            src="/logo/logo-color.png"
            alt="Evergreen Collective"
            className="h-12 w-12 object-contain pointer-events-none"
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
        </button>
      </div>

      {/* Spacer for fixed header */}
      <div
        className="transition-all duration-500 ease-out"
        style={{
          height: tabExpanded
            ? isInstalled
              ? 'calc(max(env(safe-area-inset-top), 20px) + 170px)'
              : 'calc(max(env(safe-area-inset-top), 20px) + 130px)'
            : 'calc(max(env(safe-area-inset-top), 20px) + 60px)',
        }}
      />

      {/* Featured carousel section */}
      <div className="py-4">
        {/* Embla Carousel - constrained width for large screens */}
        <div className="max-w-4xl mx-auto relative">
          {/* Left arrow - hidden on mobile, visible on wide screens */}
          <button
            onClick={scrollPrev}
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 w-10 h-10 items-center justify-center rounded-full bg-card shadow-lg hover:bg-muted transition-colors"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right arrow - hidden on mobile, visible on wide screens */}
          <button
            onClick={scrollNext}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 w-10 h-10 items-center justify-center rounded-full bg-card shadow-lg hover:bg-muted transition-colors"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="overflow-hidden cursor-grab active:cursor-grabbing py-8" ref={emblaRef}>
            <div className="flex touch-pan-y select-none items-center">
              {/* Duplicate slides for seamless looping on wide screens */}
              {[...backgrounds, ...backgrounds, ...backgrounds].map((bg, index) => {
                const realIndex = index % backgrounds.length
                const isActive = realIndex === selectedIndex

                return (
                  <div
                    key={`${bg.id}-${index}`}
                    className="min-w-0 flex-[0_0_180px] pl-4"
                  >
                    <button
                      onClick={() => onSelectBackground(bg)}
                      disabled={exporting}
                      className={`
                        relative w-full overflow-hidden rounded-xl bg-muted
                        transition-all duration-300 ease-out origin-center
                        disabled:cursor-not-allowed
                        ${isActive
                          ? 'shadow-2xl opacity-100 scale-110'
                          : 'shadow-lg opacity-50 scale-95'
                        }
                      `}
                    >
                    {/* Image container with phone aspect ratio */}
                    <div className="aspect-[9/19.5] relative">
                      <img
                        src={bg.thumbnail}
                        alt={bg.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        style={{
                          WebkitTouchCallout: 'none',
                          WebkitUserSelect: 'none',
                          userSelect: 'none',
                        }}
                      />

                      {/* Info overlay - edge to edge with gradient fade */}
                      <div
                        className={`
                          absolute bottom-0 left-0 right-0 pt-16 pb-4 px-4
                          bg-gradient-to-t from-black/90 via-black/60 to-transparent
                          transition-opacity duration-300 text-left
                          ${isActive ? 'opacity-100' : 'opacity-0'}
                        `}
                      >
                        <p className="text-white text-sm font-semibold truncate">
                          {bg.name}
                        </p>
                        <p className="text-white/80 text-xs mt-1.5 line-clamp-2">
                          {bg.description}
                        </p>
                        <p className="text-white/60 text-[11px] mt-2">
                          by {bg.designer}
                        </p>
                        {bg.expiresAt && (
                          <p className="text-amber-300 text-[11px] font-medium mt-1">
                            Until {formatExpirationDate(bg.expiresAt)}
                          </p>
                        )}
                      </div>

                      {/* Download icon overlay */}
                      <div
                        className={`
                          absolute top-2 right-2 w-8 h-8 rounded-full
                          bg-black/30
                          flex items-center justify-center
                          transition-opacity duration-300
                          ${isActive ? 'opacity-100' : 'opacity-0'}
                        `}
                      >
                        <svg
                          className="w-4 h-4 text-white"
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
                      </div>

                    </div>
                  </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tap hint */}
      <div className="px-4 text-center">
        <p className="text-muted-foreground text-xs">
          {exporting ? 'Generating wallpaper...' : (
            <>
              <span className="lg:hidden">Swipe to browse, tap to save</span>
              <span className="hidden lg:inline">Drag to browse or use arrows, click to save</span>
            </>
          )}
        </p>
      </div>

      {/* About paragraph */}
      <div className="px-6 pt-8 pb-12 text-center max-w-md mx-auto">
        <h3
          className="text-xl font-bold text-foreground mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Your Schedule, Your Style
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          Custom lock screen wallpapers featuring the upcoming Portland Timbers schedule.
          Each wallpaper displays the next 5 matches so you never miss a game.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          Home matches are shown in bold, away matches in italics. The schedule updates
          automatically so your wallpaper is always current with the latest fixtures.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Screen designs by <span className="font-medium text-foreground">@shiftymoose</span> and <span className="font-medium text-foreground">Pigeon Picnic Studio</span>. Built by fans, for fans. Rose City Til I Die.
        </p>
      </div>

      {/* Additional content for scroll length */}
      <div className="px-6 pb-8 text-center max-w-md mx-auto">
        <h3
          className="text-xl font-bold text-foreground mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          How It Works
        </h3>
        <div className="space-y-4 text-left">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-logo-green/10 flex items-center justify-center flex-shrink-0">
              <span className="text-logo-green font-bold text-sm">1</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Browse the wallpaper collection and find a design you love
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-logo-green/10 flex items-center justify-center flex-shrink-0">
              <span className="text-logo-green font-bold text-sm">2</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tap to generate your personalized wallpaper with the current schedule
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-logo-green/10 flex items-center justify-center flex-shrink-0">
              <span className="text-logo-green font-bold text-sm">3</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Save to your photos and set as your lock screen wallpaper
            </p>
          </div>
        </div>
      </div>

      {/* Spacer for bottom tab */}
      <div className="h-24" />


      {/* Bottom tab with socials - slides up when scrolling */}
      <div
        className="fixed left-0 right-0 z-50 cursor-pointer transition-all duration-700 ease-out"
        style={{
          bottom: bottomTabVisible
            ? bottomTabExpanded
              ? '0px'
              : 'calc(-70px - max(env(safe-area-inset-bottom), 20px))'
            : '-250px',
          opacity: bottomTabVisible ? 1 : 0,
          pointerEvents: bottomTabVisible ? 'auto' : 'none',
        }}
        onClick={() => bottomTabVisible && setBottomTabExpanded(!bottomTabExpanded)}
      >
          {/* Main tab shape - full width, inverted (pointing up) */}
          <div style={{ overflow: 'hidden', paddingTop: '10px', marginTop: '-10px' }}>
            <svg
              className="w-full block text-card"
              viewBox="0 0 400 70"
              preserveAspectRatio="none"
              style={{ height: '70px', filter: 'drop-shadow(0 -4px 6px rgba(0,0,0,0.1))' }}
            >
              <path
                d="M0,70 L0,62 L60,62 Q75,62 82,45 L92,20 Q100,0 120,0 L280,0 Q300,0 308,20 L318,45 Q325,62 340,62 L400,62 L400,70 Z"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* "Sponsor" text and chevron in the tab bulge */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
            style={{ top: '20px' }}
          >
            <span
              className="text-muted-foreground text-xs font-semibold tracking-widest uppercase"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Sponsor
            </span>
            <svg
              className={`w-3 h-3 text-muted-foreground transition-transform duration-300 ${bottomTabExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>

          {/* Sponsor links bar - full width, extends to safe area */}
          <div
            className="bg-card w-full pt-4 flex justify-center gap-8"
            style={{ paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 16px)' }}
          >
            {/* Buy Me a Coffee */}
            <a
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-logo-green transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364z"/>
              </svg>
              <span className="text-[10px]">Coffee</span>
            </a>
            {/* Venmo */}
            <a
              href="https://venmo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-logo-green transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 512 512">
                <path d="M444.17,32H70.28C49.85,32,32,46.7,32,66.89V441.6C32,461.91,49.85,480,70.28,480H444.06C464.6,480,480,461.8,480,441.61V66.89C480.12,46.7,464.6,32,444.17,32ZM278,387H174.32L132.75,138.44l90.75-8.62,22,176.87c20.53-33.45,45.88-86,45.88-121.87,0-19.62-3.36-33-8.61-44L365.4,124.1c9.56,15.78,13.86,32,13.86,52.57C379.25,242.17,323.34,327.26,278,387Z"/>
              </svg>
              <span className="text-[10px]">Venmo</span>
            </a>
            {/* Cash App */}
            <a
              href="https://cash.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-logo-green transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.59 3.475a5.1 5.1 0 00-3.05-3.05c-1.31-.42-2.5-.42-4.92-.42H8.36c-2.4 0-3.61 0-4.9.4a5.1 5.1 0 00-3.05 3.06C0 4.765 0 5.965 0 8.365v7.27c0 2.41 0 3.6.4 4.9a5.1 5.1 0 003.05 3.05c1.3.41 2.5.41 4.9.41h7.28c2.41 0 3.61 0 4.9-.4a5.1 5.1 0 003.06-3.06c.41-1.3.41-2.5.41-4.9v-7.25c0-2.41 0-3.61-.41-4.91zm-6.17 4.63l-.93.93a.5.5 0 01-.67.01 5 5 0 00-3.22-1.18c-.97 0-1.94.32-1.94 1.21 0 .9 1.04 1.2 2.24 1.65 2.1.7 3.84 1.58 3.84 3.64 0 2.24-1.74 3.78-4.58 3.95l-.26 1.2a.49.49 0 01-.48.39H9.63l-.09-.01a.5.5 0 01-.38-.59l.28-1.27a6.54 6.54 0 01-2.88-1.57v-.01a.48.48 0 010-.68l1-.97a.49.49 0 01.67 0c.91.86 2.13 1.34 3.39 1.32 1.3 0 2.17-.55 2.17-1.42 0-.87-.88-1.1-2.54-1.72-1.76-.63-3.43-1.52-3.43-3.6 0-2.42 2.01-3.6 4.39-3.71l.25-1.23a.48.48 0 01.48-.38h1.78l.1.01c.26.06.43.31.37.57l-.27 1.37c.9.3 1.75.77 2.48 1.39l.02.02c.19.2.19.5 0 .68z"/>
              </svg>
              <span className="text-[10px]">Cash App</span>
            </a>
            {/* PayPal */}
            <a
              href="https://paypal.me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-logo-green transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 00-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 00-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 00.554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 01.923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
              </svg>
              <span className="text-[10px]">PayPal</span>
            </a>
        </div>
      </div>

      {/* Loading overlay */}
      {exporting && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center">
          <div className="bg-card rounded-2xl px-8 py-6 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Generating wallpaper...</p>
          </div>
        </div>
      )}
    </div>
  )
}
