'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getPrizeById } from '@/lib/prizes'
import RedeemInstructionsModal from '@/components/RedeemInstructionsModal'
import SocialGateModal from '@/components/SocialGateModal'
import WinnerStoryDisplay from '@/components/WinnerStoryDisplay'
import { Trophy } from 'lucide-react'


function StatusContent() {
    const searchParams = useSearchParams()

    // Add missing state variables
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showInstructions, setShowInstructions] = useState(false)
    const [showTerms, setShowTerms] = useState(false)
    const [winnerStories, setWinnerStories] = useState<any[]>([])
    const [showWinnerStory, setShowWinnerStory] = useState(false)
    const [isStoryManual, setIsStoryManual] = useState(false)

    const [showSocialGate, setShowSocialGate] = useState(false)

    useEffect(() => {
        // Check for 'show_story' param
        if (searchParams.get('show_story') === 'true') {
            setShowWinnerStory(true)
            setIsStoryManual(false)
            // Cleanup URL
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete('show_story')
            window.history.replaceState({}, '', newUrl.toString())
        }

        // Fetch Stories
        fetch('/api/winner-stories')
            .then(res => res.json())
            .then(data => setWinnerStories(data.data || []))
            .catch(err => console.error("Failed to load stories", err))

        // Fetch status based on HttpOnly Session Cookie
        fetch(`/api/Participant/check`)
            .then(res => {
                if (res.status === 401) {
                    window.location.href = '/?error=please_login';
                    return null;
                }
                return res.json();
            })
            .then(res => {
                if (!res) return;

                if (res.authenticated) {
                    // Check Terms & Profile FIRST
                    if (!res.termsAgreed) {
                        setShowSocialGate(true)
                        // Don't return, allow background to load but be covered? 
                        // Or don't load data yet?
                        // User wants to block entry. If we don't setData, it shows "User Not Found".
                        // Better to show data but have modal covering it.
                        // However, waiting for "onComplete" to really "activate" the page.
                    }

                    if (!res.hasSpun) {
                        window.location.href = '/'
                        return
                    }
                    setData(res)
                }
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#ED1A41] flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h1>
                <p className="text-gray-500 mb-6">We couldn't find your record. Please try logging in again.</p>
                <button
                    onClick={() => {
                        localStorage.removeItem('participantId')
                        localStorage.removeItem('participantName')
                        window.location.href = '/?error=user_not_found'
                    }}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
                >
                    Go Home
                </button>
            </div>
        )
    }

    // data.prize is the ID (e.g., p4)
    const prizeDetails = getPrizeById(data.prize) || { label: data.prize, image: null, id: 'unknown', color: '#000000', redeemCondition: '' }
    const isWinner = prizeDetails.label && !prizeDetails.label.toLowerCase().includes('better luck')



    return (
        // <div className="flex justify-center items-center gap-2 min-h-screen bg-[url('/x-max-bg.jpg')] object-cover bg-cover bg-center flex flex-col items-center p-4 pt-12">
        <div className="flex justify-center items-center gap-2 min-h-screen bg-[url('/new-year-bg.avif')] object-cover bg-cover bg-center flex flex-col items-center p-4 pt-12">

            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-[#ED1A41] p-6 text-center text-white relative overflow-hidden flex flex-col items-center">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                    {/* Brand Logo */}
                    <div className="relative flex flex-col items-center justify-center z-10 gap-4">
                        <img src="/brand-logo-white.jpg" alt="Logo" className="w-60" />
                        <h1 className="text-lg font-bold relative z-10">SULTHAN BATHERY</h1>

                        <button
                            onClick={() => {
                                setShowWinnerStory(true)
                                setIsStoryManual(true)
                            }}
                            className="flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-yellow-300 transition-all active:scale-95"
                        >
                            <Trophy size={16} />
                            View Winner Gallery
                        </button>
                    </div>


                </div>
                <div className="p-8 text-center">
                    <div className="mb-6">
                        <div className="mb-2 flex flex-col items-center text-center text-gray-800">
                            <h1 className="text-2xl font-bold relative z-10">Status Report</h1>
                            <p className="opacity-90 relative z-10">Hope you had fun!</p>
                        </div>
                        <div className="w-32 h-32 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner overflow-hidden border-4 border-yellow-100">
                            {prizeDetails.image ? (
                                <img src={prizeDetails.image} alt={prizeDetails.label} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl">{isWinner ? '🎁' : '😢'}</span>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-1">
                            {isWinner ? 'Congratulations!' : 'Better Luck Next Time'}
                        </h2>
                        <p className="text-red-500 font-medium text-lg">{prizeDetails.label}</p>
                        {prizeDetails.redeemCondition && (
                            <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-full mt-3 inline-block font-medium">
                                ℹ️ {prizeDetails.redeemCondition}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3 border border-gray-100">
                        <div className="flex justify-between">
                            <span className="text-gray-500 text-sm">Name</span>
                            <span className="font-medium text-gray-800">{data.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 text-sm">Phone</span>
                            <span className="font-medium text-gray-800">+91 {data.phone}</span>
                        </div>
                        {isWinner && (
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">Prize</span>
                                <span className="font-medium text-red-600 font-bold">{prizeDetails.label}</span>
                            </div>
                        )}
                        {isWinner && (
                            <>
                                <div className="h-px bg-gray-200 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 text-sm">Redeem Code</span>
                                    <span className="font-mono font-bold text-red-600 text-lg">{data.redeemCode || 'PENDING'}</span>
                                </div>
                                <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded mt-2 border border-yellow-100">
                                    Show this code at the counter to claim your prize.
                                </div>
                            </>
                        )}
                    </div>

                    <div className="space-y-3">

                        {/* Claimed State */}
                        {data.redeemStatus === 'claimed' && (
                            <button className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg cursor-default">
                                Prize Claimed ✅
                            </button>
                        )}

                        {/* Rejected State */}
                        {data.redeemStatus === 'rejected' && (
                            <div className="space-y-4">
                                <button className="w-full bg-red-100 text-red-700 font-bold py-3 rounded-xl border border-red-200 cursor-default">
                                    Claim Rejected ❌
                                </button>

                                <div className="bg-red-50 p-4 rounded-xl text-left border border-red-100">
                                    <p className="text-xs text-red-500 font-bold uppercase mb-1">Reason</p>
                                    <p className="text-gray-800 font-medium">{data.rejectionReason || "Please contact support"}</p>
                                </div>
                            </div>
                        )}

                        {/* Pending State */}
                        {data.redeemStatus === 'pending' && isWinner && (
                            <button
                                onClick={() => setShowInstructions(true)}
                                className="w-full bg-yellow-400 text-yellow-900 hover:bg-yellow-500 font-bold py-3 rounded-xl shadow-lg transition-colors cursor-pointer"
                            >
                                Prize Pending (Visit Store) ⏳
                            </button>
                        )}


                        {/* Contact Store - Shown for ALL winners (Claimed, Rejected, Pending) */}
                        {isWinner && (
                            <div className="bg-white p-4 rounded-xl text-left border border-gray-200 shadow-sm mt-4">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-2">Contact Store</p>
                                <p className="font-bold text-gray-800">Yes Bharath Wedding Collections</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Main Road in Sulthan Bathery, Wayanad,
                                    Kerala (PIN 673592)
                                </p>
                                <a href="tel:+919495919900" className="block mt-3 text-blue-600 font-bold text-sm">
                                    📞 +91 94959 19900
                                </a>
                            </div>
                        )}

                        {/* Lost State */}
                        {!isWinner && (
                            <button className="w-full bg-gray-300 text-gray-600 font-bold py-3 rounded-xl cursor-not-allowed">
                                Spin Used
                            </button>
                        )}
                        <Link
                            href="/?switch=true"
                            className="block w-full py-3 text-gray-500 hover:text-gray-700 text-sm font-medium"
                        >
                            Back to Home
                        </Link>

                        <button
                            onClick={() => setShowTerms(true)}
                            className="block w-full py-2 text-gray-400 hover:text-gray-600 text-xs mt-4"
                        >
                            Terms & Conditions
                        </button>
                    </div>
                </div >
            </div >

            {/* <div className="flex justify-center items-center gap-2">
                <p className="text-gray-400 text-sm">Yes Bharath Wedding Collections Sulthan Baterh Lucky Wheel Event 2025</p>
                <p className="text-gray-400 text-sm">
                    Developed by <a href="https://www.linkedin.com/in/firdous-n-5165a2257/" target="_blank" rel="noopener noreferrer" className="hover:underline font-medium">Firdous N</a>
                </p>
            </div> */}

            <RedeemInstructionsModal
                isOpen={showInstructions}
                onClose={() => setShowInstructions(false)}
            />

            <SocialGateModal
                isOpen={showTerms}
                readOnly={true}
                onClose={() => setShowTerms(false)}
            />

            {/* BLOCKING SOCIAL GATE FOR T&C */}
            <SocialGateModal
                isOpen={showSocialGate}
                onComplete={() => {
                    setShowSocialGate(false)
                    setShowWinnerStory(true) // Trigger winner story after gate to show "Intro"
                }}
            />

            <WinnerStoryDisplay
                isOpen={showWinnerStory}
                onClose={() => setShowWinnerStory(false)}
                stories={winnerStories}
                isManualTrigger={isStoryManual}
            />
        </div >
    )
}

export default function StatusPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <StatusContent />
        </Suspense>
    )
}
