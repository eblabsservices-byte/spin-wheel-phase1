import React from 'react'

export default function AdminNavbar() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-[#ED1A41] text-white p-4 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <img src="/brand-logo-white.jpg" alt="Logo" className="w-32 md:w-40" />

          <div className="hidden md:flex gap-4">
            <a href="/sys_9e4a/dashboard" className="text-white/90 hover:text-white font-medium hover:underline">
              Participants
            </a>
            <a href="/sys_9e4a/winner-gallery" className="text-white/90 hover:text-white font-medium hover:underline">
              Winner Gallery
            </a>
          </div>
        </div>

        <div className="text-right">
          <h1 className="text-xl md:text-2xl font-bold">Admin Panel</h1>
          <p className="text-xs md:text-sm text-gray-100 opacity-90">Yes Bharath</p>
        </div>
      </div>
    </nav>
  )
}
