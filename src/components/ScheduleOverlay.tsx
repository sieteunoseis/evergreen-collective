import type { Fixture } from '@/lib/constants'

interface ScheduleOverlayProps {
  fixtures: Fixture[]
  maxMatches?: number
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export function ScheduleOverlay({
  fixtures,
  maxMatches = 4,
}: ScheduleOverlayProps) {
  const displayFixtures = fixtures.slice(0, maxMatches)

  if (displayFixtures.length === 0) {
    return (
      <div className="absolute inset-x-0 bottom-[10%] h-[18%] flex items-center justify-center">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-6 py-3">
          <p className="text-white/80 text-sm">No upcoming matches</p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-x-0 bottom-[10%] h-[18%] px-4 py-2">
      <div className="h-full bg-black/60 backdrop-blur-sm rounded-xl px-4 py-3 flex flex-col justify-center gap-1">
        {displayFixtures.map((fixture) => (
          <div
            key={fixture.id}
            className="flex items-center justify-between text-white text-xs gap-2"
          >
            <span className="w-12 text-white/70 shrink-0">
              {formatDate(fixture.date)}
            </span>
            <span className="w-5 text-center text-white/50 shrink-0">
              {fixture.isHome ? 'vs' : '@'}
            </span>
            <span className="flex-1 font-medium truncate">
              {fixture.opponent}
            </span>
            <span className="text-white/70 shrink-0">
              {formatTime(fixture.time)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
