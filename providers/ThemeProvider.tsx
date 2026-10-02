'use client'
import { createContext, useContext, useEffect, useState } from 'react'

import { Toaster } from 'react-hot-toast'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({ theme: 'dark', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialise from the class already applied by the blocking script (avoids a
  // second paint / state-sync flash). Falls back to 'dark' for SSR.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    return (localStorage.getItem('synarc-theme') as Theme) ?? 'dark'
  })

  useEffect(() => {
    localStorage.setItem('synarc-theme', theme)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Toaster 
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#0F172A' : '#FFFFFF',
            color: theme === 'dark' ? '#FFFFFF' : '#0F172A',
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            fontSize: '12px',
          }
        }}
        position="top-right"
      />
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
