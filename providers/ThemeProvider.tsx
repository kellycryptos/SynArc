'use client'
import { createContext, useContext, useEffect, useState } from 'react'

import { Toaster } from 'react-hot-toast'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({ theme: 'dark', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('synarc-theme') as Theme
    if (saved) setTheme(saved)
  }, [])

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
