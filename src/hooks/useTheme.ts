import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system'
    }
    return 'system'
  })

  useEffect(() => {
    const root = document.documentElement

    // Remove both classes first
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      // Let the CSS media query handle it
      localStorage.removeItem('theme')
    } else {
      // Apply the explicit theme
      root.classList.add(theme)
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  const cycleTheme = () => {
    setTheme((current) => {
      if (current === 'system') return 'light'
      if (current === 'light') return 'dark'
      return 'system'
    })
  }

  return { theme, setTheme, cycleTheme }
}
