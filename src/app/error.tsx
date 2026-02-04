'use client' // Error components must be Client Components

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an analytics service
        console.error('Application Error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong!</h2>
            <p className="text-gray-500 mb-6 max-w-md">
                We apologize for the inconvenience. An unexpected error occurred.
                {process.env.NODE_ENV === 'development' && (
                    <span className="block mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
                        {error.message}
                    </span>
                )}
            </p>
            <div className="flex gap-4">
                <button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition"
                >
                    Try Again
                </button>
                <Link
                    href="/"
                    className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                    Go Home
                </Link>
            </div>
        </div>
    )
}
