'use client'

import { useEffect, useState } from 'react'
import Snowfall from 'react-snowfall'

export default function GlobalSnowfall() {
    const [images, setImages] = useState<HTMLImageElement[]>([])

    useEffect(() => {
        if (typeof document !== 'undefined') {
            const img1 = document.createElement('img')
            img1.src = '/snowflake-1.png'
            const img2 = document.createElement('img')
            img2.src = '/snowflake-2.png'
            setImages([img1, img2])
        }
    }, [])

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999, // Top of everything
            pointerEvents: 'none' // Don't block clicks
        }}>
            <Snowfall
                snowflakeCount={30} // Optimized performance
                radius={[20, 40]}
                images={images}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                }}
            />
        </div>
    )
}
