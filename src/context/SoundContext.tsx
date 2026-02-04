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
    try {
      const saved = localStorage.getItem('soundEnabled')
      if (saved !== null) {
        setIsSoundEnabled(saved === 'true')
      }
    } catch (e) {
      console.warn("LocalStorage access denied", e)
    }
  }, [])

  const toggleSound = () => {
    setIsSoundEnabled(prev => {
      const newState = !prev
      try {
        localStorage.setItem('soundEnabled', String(newState))
      } catch (e) {
        console.warn("LocalStorage access denied", e)
      }
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
