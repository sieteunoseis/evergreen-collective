import { useRef, useEffect, useState } from 'react'
import { BACKGROUNDS, type Background } from '@/lib/constants'

interface BackgroundPickerProps {
  onSelect: (background: Background) => void
  exporting?: boolean
}

// Create extended list with duplicates for infinite scroll effect
const EXTENDED_BACKGROUNDS = [
  ...BACKGROUNDS,
  ...BACKGROUNDS,
  ...BACKGROUNDS,
]

export function BackgroundPicker({
  onSelect,
  exporting,
}: BackgroundPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(BACKGROUNDS.length) // Start at middle set
  const [tabExpanded, setTabExpanded] = useState(false)
  const [bottomTabExpanded, setBottomTabExpanded] = useState(false)
  const [bottomTabVisible, setBottomTabVisible] = useState(false)

  // Track page scroll to show/hide bottom tab
  useEffect(() => {
    const handlePageScroll = () => {
      // Show bottom tab after scrolling down 100px
      const shouldShow = window.scrollY > 100
      setBottomTabVisible(shouldShow)
      // Hide expanded state when tab becomes hidden
      if (!shouldShow) {
        setBottomTabExpanded(false)
      }
    }

    window.addEventListener('scroll', handlePageScroll, { passive: true })
    return () => window.removeEventListener('scroll', handlePageScroll)
  }, [])


  // Scroll to middle set on mount, centering the first card of the middle set
  useEffect(() => {
    if (scrollRef.current) {
      const cardWidth = 180
      const gap = 16
      // Scroll to center the first card of the middle set (index = BACKGROUNDS.length)
      // scrollLeft = 0 means the first card is centered (due to padding)
      // Each subsequent card requires scrolling by (cardWidth + gap)
      const scrollTo = BACKGROUNDS.length * (cardWidth + gap)
      scrollRef.current.scrollLeft = scrollTo
    }
  }, [])

  // Track scroll position to determine active card
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleScroll = () => {
      const cardWidth = 180
      const gap = 16
      const scrollLeft = container.scrollLeft
      // Since padding centers the first card at scrollLeft=0,
      // the active index is simply scrollLeft / (cardWidth + gap)
      const index = Math.round(scrollLeft / (cardWidth + gap))
      setActiveIndex(Math.max(0, Math.min(index, EXTENDED_BACKGROUNDS.length - 1)))
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Status bar background - always visible to maintain green status bar */}
      <div
        className="fixed top-0 left-0 right-0 z-40 bg-logo-green"
        style={{ height: 'max(env(safe-area-inset-top), 20px)' }}
      />

      
      {/* Tab-style navbar with center bulge - clickable to slide down and reveal slogan */}
      <div
        className="fixed left-0 right-0 z-50 cursor-pointer transition-all duration-500 ease-out"
        style={{
          top: tabExpanded ? '20px' : 'calc(max(env(safe-area-inset-top), 20px) - 40px)',
        }}
        onClick={() => setTabExpanded(!tabExpanded)}
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

      {/* Spacer for fixed header */}
      <div
        className="transition-all duration-500 ease-out"
        style={{
          height: tabExpanded
            ? 'calc(max(env(safe-area-inset-top), 12px) + 96px)'
            : 'calc(max(env(safe-area-inset-top), 12px) + 68px)',
        }}
      />

      {/* Featured carousel section */}
      <div className="py-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 px-4">
          Tap to Download
        </h2>

        {/* Horizontal scroll carousel */}
        <div
          ref={scrollRef}
          className="
            flex gap-4 overflow-x-auto pb-4
            snap-x snap-mandatory
            scrollbar-hide
          "
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingLeft: 'calc(50% - 90px)',
            paddingRight: 'calc(50% - 90px)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {EXTENDED_BACKGROUNDS.map((bg, index) => {
            const isActive = index === activeIndex
            const distance = Math.abs(index - activeIndex)
            const isNearby = distance <= 1

            return (
              <button
                key={`${bg.id}-${index}`}
                onClick={() => onSelect(bg)}
                disabled={exporting}
                className={`
                  group relative flex-shrink-0 overflow-hidden rounded-xl bg-gray-100
                  transition-all duration-300 ease-out
                  snap-center
                  disabled:cursor-not-allowed
                  ${isActive
                    ? 'shadow-xl scale-100 opacity-100'
                    : isNearby
                      ? 'shadow-lg scale-95 opacity-70'
                      : 'shadow-md scale-90 opacity-40 blur-[1px]'
                  }
                `}
                style={{ width: 180 }}
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

                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                  {/* Title overlay bar */}
                  <div className={`absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                    <p className="text-white text-xs font-medium text-left truncate">
                      {bg.name}
                    </p>
                    {bg.credit && (
                      <p className="text-white/60 text-[10px] text-left truncate mt-0.5">
                        by {bg.credit}
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
            )
          })}
        </div>
      </div>

      {/* Tap hint */}
      <div className="px-4 text-center">
        <p className="text-gray-400 text-xs">
          {exporting ? 'Generating wallpaper...' : 'Tap a wallpaper to save it'}
        </p>
      </div>

      {/* About paragraph */}
      <div className="px-6 pt-8 pb-12 text-center max-w-md mx-auto">
        <h3
          className="text-xl font-bold text-gray-800 mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Your Schedule, Your Style
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-4">
          Custom lock screen wallpapers featuring the upcoming Portland Timbers schedule.
          Each wallpaper displays the next 5 matches so you never miss a game.
        </p>
        <p className="text-gray-500 text-sm leading-relaxed mb-4">
          Home matches are shown in bold, away matches in italics. The schedule updates
          automatically so your wallpaper is always current with the latest fixtures.
        </p>
        <p className="text-gray-500 text-sm leading-relaxed">
          Screen designs by <span className="font-medium text-gray-600">@shiftymoose</span> and <span className="font-medium text-gray-600">Pigeon Picnic Studio</span>. Built by fans, for fans. Rose City Til I Die.
        </p>
      </div>

      {/* Additional content for scroll length */}
      <div className="px-6 pb-8 text-center max-w-md mx-auto">
        <h3
          className="text-xl font-bold text-gray-800 mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          How It Works
        </h3>
        <div className="space-y-4 text-left">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-logo-green/10 flex items-center justify-center flex-shrink-0">
              <span className="text-logo-green font-bold text-sm">1</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Browse the wallpaper collection and find a design you love
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-logo-green/10 flex items-center justify-center flex-shrink-0">
              <span className="text-logo-green font-bold text-sm">2</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Tap to generate your personalized wallpaper with the current schedule
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-logo-green/10 flex items-center justify-center flex-shrink-0">
              <span className="text-logo-green font-bold text-sm">3</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
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
          {/* Main tab shape - full width, inverted (pointing up), white */}
          <div style={{ overflow: 'hidden', paddingTop: '10px', marginTop: '-10px' }}>
            <svg
              className="w-full block"
              viewBox="0 0 400 70"
              preserveAspectRatio="none"
              style={{ height: '70px', filter: 'drop-shadow(0 -4px 6px rgba(0,0,0,0.1))' }}
            >
              <path
                d="M0,70 L0,62 L60,62 Q75,62 82,45 L92,20 Q100,0 120,0 L280,0 Q300,0 308,20 L318,45 Q325,62 340,62 L400,62 L400,70 Z"
                fill="white"
              />
            </svg>
          </div>

          {/* "Connect" text and chevron in the tab bulge */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
            style={{ top: '20px' }}
          >
            <span
              className="text-gray-600 text-xs font-semibold tracking-widest uppercase"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Connect
            </span>
            <svg
              className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${bottomTabExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>

          {/* Social links bar - full width, extends to safe area */}
          <div
            className="bg-white w-full pt-4 flex justify-center gap-10"
            style={{ paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 16px)' }}
          >
            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-logo-green transition-colors"
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
              className="text-gray-500 hover:text-logo-green transition-colors"
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
              className="text-gray-500 hover:text-logo-green transition-colors"
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
              className="text-gray-500 hover:text-logo-green transition-colors"
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
          <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 text-sm">Generating wallpaper...</p>
          </div>
        </div>
      )}
    </div>
  )
}
