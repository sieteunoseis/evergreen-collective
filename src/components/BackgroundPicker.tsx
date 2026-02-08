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
      <div className="py-6">
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

          <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
            <div className="flex touch-pan-y select-none">
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
                        transition-all duration-300 ease-out
                        disabled:cursor-not-allowed
                        ${isActive
                          ? 'shadow-xl scale-100 opacity-100'
                          : 'shadow-lg scale-95 opacity-60'
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

                      {/* Info overlay box - transparent black with border at bottom */}
                      <div
                        className={`
                          absolute bottom-2 left-2 right-2 p-2
                          bg-black/60 border border-white/20 rounded-lg
                          transition-opacity duration-300 text-left
                          ${isActive ? 'opacity-100' : 'opacity-0'}
                        `}
                      >
                        <p className="text-white text-[10px] font-semibold truncate">
                          {bg.name}
                        </p>
                        <p className="text-white/70 text-[8px] mt-0.5 line-clamp-2">
                          {bg.description}
                        </p>
                        <p className="text-white/50 text-[7px] mt-1">
                          by {bg.designer}
                        </p>
                        {bg.expiresAt && (
                          <p className="text-amber-300 text-[7px] font-medium mt-0.5">
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

          {/* "Connect" text and chevron in the tab bulge */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
            style={{ top: '20px' }}
          >
            <span
              className="text-muted-foreground text-xs font-semibold tracking-widest uppercase"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Connect
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

          {/* Social links bar - full width, extends to safe area */}
          <div
            className="bg-card w-full pt-4 flex justify-center gap-10"
            style={{ paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 16px)' }}
          >
            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-logo-green transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            {/* Twitter/X */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-logo-green transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            {/* TikTok */}
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-logo-green transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
            </a>
            {/* YouTube */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-logo-green transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
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
