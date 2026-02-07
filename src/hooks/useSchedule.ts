import { useState, useEffect } from 'react'
import type { Fixture } from '@/lib/constants'
import { MOCK_FIXTURES } from '@/lib/mockData'

interface UseScheduleResult {
  fixtures: Fixture[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useSchedule(): UseScheduleResult {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedule = async () => {
    setLoading(true)
    setError(null)

    try {
      // For local development, use mock data
      // In production, this would call /api/schedule
      if (import.meta.env.DEV) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500))
        setFixtures(MOCK_FIXTURES)
      } else {
        const response = await fetch('/api/schedule')
        if (!response.ok) {
          throw new Error('Failed to fetch schedule')
        }
        const data = await response.json()
        setFixtures(data.fixtures)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Fall back to mock data on error
      setFixtures(MOCK_FIXTURES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedule()
  }, [])

  return {
    fixtures,
    loading,
    error,
    refresh: fetchSchedule,
  }
}
