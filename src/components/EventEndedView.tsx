'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Trophy, User, X } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import WinnerStoryDisplay from './WinnerStoryDisplay'

// Reuse Login Modal
const LoginStatusModal = dynamic(() => import('./LoginStatusModal'), { ssr: false })

export default function EventEndedView({ initialSessionData }: { initialSessionData: any }) {
    const [showGallery, setShowGallery] = useState(false) // Default false as requested
    const [winnerStories, setWinnerStories] = useState<any[]>([])
    const [showLogin, setShowLogin] = useState(false)
    const [urlError, setUrlError] = useState('')
    const [hideStatusCheck, setHideStatusCheck] = useState(false)
    const [isGalleryLoading, setIsGalleryLoading] = useState(false)

    // Check URL for error on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('error')) setUrlError(params.get('error')!);
    }, []);

    // Fetch stories for the gallery
    useEffect(() => {
        if (!showGallery) return;
        if (winnerStories.length > 0) return;

        const loadStories = async () => {
            setIsGalleryLoading(true);
            try {
                // 1. Initial Fast Load (4 items = 1 small batch to show something fast)
                const res1 = await fetch('/api/gallery-data?limit=4');
                const json1 = await res1.json();
                const initialStories = json1.data || [];
                setWinnerStories(initialStories);
                setIsGalleryLoading(false); // Stop loading spinner as soon as we have ANY data

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
                setIsGalleryLoading(false);
            }
        };

        loadStories();
    }, [showGallery])

    // ... (logic)

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
            {/* ... */}
            <div className="z-10 flex flex-col items-center gap-8 p-4 text-center">
                {/* Brand Logo */}
                <div className="w-48 md:w-64 drop-shadow-2xl relative aspect-[2.56/1]">
                    <Image
                        src="/brand-logo-red.png"
                        alt="Yes Bharath"
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority
                    />
                </div>

                <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl max-w-lg w-full">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)]">
                        EVENT <span className="text-red-500">ENDED</span>
                    </h1>
                    <p className="text-gray-300 text-lg mb-8">
                        Thank you to all our participants! <br />
                        The Lucky Wheel event has concluded.
                    </p>

                    <div className="flex flex-col gap-4">
                        {/* {!hideStatusCheck && (
                            <button
                                onClick={handleCheckStatus}
                                className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-4 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                            >
                                <User size={20} />
                                Check My Status
                            </button>
                        )} */}

                        <button
                            onClick={() => setShowGallery(true)}
                            className="w-full bg-white/10 text-yellow-400 border border-yellow-400/30 font-bold py-4 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trophy size={20} />
                            View Winners Gallery
                        </button>
                    </div>


                </div>
            </div>

            {/* Winner Gallery Overlay - Using External Component */}
            <WinnerStoryDisplay
                isOpen={showGallery}
                onClose={() => setShowGallery(false)}
                stories={winnerStories}
                isManualTrigger={true}
                isLoading={isGalleryLoading}
            />

            {/* Login Modal for Status Check */}
            <LoginStatusModal
                isOpen={showLogin}
                error={urlError}
                hideTerms={true}
                onSuccess={(data) => {
                    if (data.hasSpun) {
                        window.location.href = '/status';
                    } else {
                        // New user / hasn't spun
                        setShowLogin(false);
                        setHideStatusCheck(true);
                        setShowGallery(true); // Auto-show gallery as requested "then show winner galary"
                    }
                }}
            />
        </div>
    )
}
