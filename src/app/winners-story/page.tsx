'use client'

import { useState, useEffect } from 'react'
import WinnerGalleryOverlay from '@/components/WinnerStoryDisplay'
import { useRouter } from 'next/navigation'

export default function WinnersStoryPage() {
    const router = useRouter()
    const [winnerStories, setWinnerStories] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Fetch stories for the gallery
    useEffect(() => {
        const loadStories = async () => {
            setIsLoading(true);
            try {
                // 1. Initial Fast Load (4 items)
                const res1 = await fetch('/api/gallery-data?limit=4');
                const json1 = await res1.json();
                const initialStories = json1.data || [];
                setWinnerStories(initialStories);
                setIsLoading(false); // Show content ASAP

                // 2. Background Load (Rest)
                if (initialStories.length === 4) {
                    const res2 = await fetch('/api/gallery-data?skip=4&limit=50');
                    const json2 = await res2.json();
                    const moreStories = json2.data || [];

                    if (moreStories.length > 0) {
                        setWinnerStories(prev => {
                            const ids = new Set(prev.map((s: any) => s._id));
                            const uniqueMore = moreStories.filter((s: any) => !ids.has(s._id));
                            return [...prev, ...uniqueMore];
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to load stories", err);
                setIsLoading(false);
            }
        };

        loadStories();
    }, [])

    return (
        <div className="min-h-screen bg-black">
             {/* Render the "Overlay" but effectively as the page content */}
            <WinnerGalleryOverlay
                isOpen={true}
                onClose={() => router.push('/')} // Navigate home on close
                stories={winnerStories}
                isManualTrigger={true}
                isLoading={isLoading}
            />
        </div>
    )
}
