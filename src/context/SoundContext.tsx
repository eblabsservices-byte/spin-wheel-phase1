'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SoundContextType {
  isSoundEnabled: boolean
  toggleSound: () => void
}

const SoundContext = createContext<SoundContextType | undefined>(undefined)

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)

  useEffect(() => {
    // Load preference from local storage
    const saved = localStorage.getItem('soundEnabled')
    if (saved !== null) {
      setIsSoundEnabled(saved === 'true')
    }
  }, [])

  const toggleSound = () => {
    setIsSoundEnabled(prev => {
      const newState = !prev
      localStorage.setItem('soundEnabled', String(newState))
      return newState
    })
  }

  return (
    <SoundContext.Provider value={{ isSoundEnabled, toggleSound }}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSound() {
  const context = useContext(SoundContext)
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider')
  }
  return context
}
