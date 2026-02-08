import { useState, useEffect } from 'react'
import { loadBackgrounds, type Background } from '@/lib/constants'

interface UseBackgroundsResult {
  backgrounds: Background[]
  loading: boolean
}

export function useBackgrounds(): UseBackgroundsResult {
  const [backgrounds, setBackgrounds] = useState<Background[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBackgrounds()
      .then(setBackgrounds)
      .finally(() => setLoading(false))
  }, [])

  return { backgrounds, loading }
}
