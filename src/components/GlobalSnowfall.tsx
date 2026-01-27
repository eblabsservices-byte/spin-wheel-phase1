'use client'

import { useEffect, useState } from 'react'
import Snowfall from 'react-snowfall'

export default function GlobalSnowfall() {
    const [images, setImages] = useState<HTMLImageElement[]>([])

    useEffect(() => {
        if (typeof document !== 'undefined') {
            const img1 = document.createElement('img')
            // img1.src = '/snowflake-1.png'
            img1.src = '/star-1.avif'
            const img2 = document.createElement('img')
            img2.src = '/star-2.avif'
            setImages([img1, img2])
        }
    }, [])

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9999, // Top of everything
                pointerEvents: 'none' // Don't block clicks
            }}>
            <Snowfall snowflakeCount={25} radius={[20, 30]} images={images}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
        </div>
    )
}
