import React from 'react'

export default function AdminNavbar() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-[#ED1A41] text-white p-4 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <img src="/brand-logo-white.jpg" alt="Logo" className="w-32 md:w-40" />

        <div className="text-right">
          <h1 className="text-xl md:text-2xl font-bold">Admin Panel</h1>
          <p className="text-xs md:text-sm text-gray-100 opacity-90">Participant Management</p>
        </div>
      </div>
    </nav>
  )
}
