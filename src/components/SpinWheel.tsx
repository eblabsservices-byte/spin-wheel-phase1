'use client'

import React, {
    useRef,
    useEffect,
    useImperativeHandle,
    forwardRef,
    useState,
} from 'react'
import { useSearchParams } from 'next/navigation'
// import TermsModal from './TermsModal'
// import RedeemModal from './RedeemModal'
import LoginStatusModal from './LoginStatusModal'
import ClaimPrizeModal from './ClaimPrizeModal'
import SocialGateModal from './SocialGateModal'
import { useSound } from '@/context/SoundContext'
import Image from 'next/image'
import { trackEvent } from '@/hooks/useAnalytics'

/* =======================
   TYPES
======================= */

export type Sector = {
    id?: string
    color: string
    text: string
    label: string
    image?: string
    redeemCondition?: string
}

export type SpinWheelProps = {
    sectors: Sector[]
    size?: number
    onSpinEnd?: (sector: Sector) => void
    spinButtonText?:
    | string
    | ((isSpinning: boolean, currentLabel: string) => string)
    labelFontSize?: number
    spinButtonFontSize?: number
    spinButtonClassName?: string
    spinButtonArrowColor?: string
    wheelBaseWidth?: string | number
    wheelBaseBottom?: string | number
    spinDuration?: number
    easingFunction?: (t: number) => number
}

export type SpinWheelHandle = {
    spin: () => void
}

/* =======================
   CONSTANTS
======================= */

const TAU = 2 * Math.PI
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/* =======================
   COMPONENT
======================= */

const SpinWheel = forwardRef<SpinWheelHandle, SpinWheelProps>(
    (
        {
            sectors,
            size = 500,
            onSpinEnd,
            spinButtonText,
            labelFontSize = 16,
            spinButtonFontSize = 18,
            spinButtonClassName = '',
            spinButtonArrowColor = '#fff',
            wheelBaseWidth = '80%',
            wheelBaseBottom = '-45px',
            spinDuration = 5000,
            easingFunction,
        },
        ref
    ) => {
        if (!sectors || sectors.length === 0) return null

        const searchParams = useSearchParams()

        // State to persist error message after we clean the URL
        const [urlError, setUrlError] = useState(searchParams.get('error') || '')
        const { isSoundEnabled } = useSound()
        // snowflake images removed


        useEffect(() => {
            const errorParam = searchParams.get('error')
            if (errorParam) {
                setUrlError(errorParam)
                // Remove error param from URL for a cleaner look
                const newUrl = new URL(window.location.href)
                newUrl.searchParams.delete('error')
                window.history.replaceState({}, '', newUrl.toString())
            }
        }, [searchParams])

        const isSwitching = searchParams.get('switch')

        const [isLoadingSession, setIsLoadingSession] = useState(true)
        const [showLogin, setShowLogin] = useState(false)
        const [canSpin, setCanSpin] = useState(false)
        const [hasSpun, setHasSpun] = useState(false)
        const [showTerms, setShowTerms] = useState(false)
        const [showSocialGate, setShowSocialGate] = useState(false)
        const [showRedeem, setShowRedeem] = useState(false)
        const [redeemCode, setRedeemCode] = useState('')
        //
        const [imageHeight, setImageHeight] = useState(0)
        const [winner, setWinner] = useState<Sector | null>(null)
        const [showModal, setShowModal] = useState(false)

        const canvasRef = useRef<HTMLCanvasElement>(null)
        const imgRef = useRef<HTMLImageElement>(null)

        const angleRef = useRef(0)
        const startTimeRef = useRef<number | null>(null)
        const targetAngleRef = useRef(0)
        const spinningRef = useRef(false)
        const isProcessingRef = useRef(false) // Guard against double-clicks
        const audioRef = useRef<HTMLAudioElement | null>(null)

        /* =======================
           RESPONSIVE LOGIC
        ======================= */
        const [wheelSize, setWheelSize] = useState(size)

        useEffect(() => {
            const handleResize = () => {
                const screenWidth = window.innerWidth
                // Mobile: Fit width minus padding (40px). Desktop: Caps at 'size' prop (450px)
                setWheelSize(Math.min(screenWidth - 40, size))
            }

            // Initial calc
            handleResize()

            window.addEventListener('resize', handleResize)
            return () => window.removeEventListener('resize', handleResize)
        }, [size])

        const arc = TAU / sectors.length

        const imagesRef = useRef<{ [key: string]: HTMLImageElement }>({})
        const [imagesLoaded, setImagesLoaded] = useState(false)

        // Preload Images
        useEffect(() => {
            let loadedCount = 0
            const totalImages = sectors.filter(s => s.image).length
            if (totalImages === 0) {
                setImagesLoaded(true)
                return
            }

            sectors.forEach(sector => {
                if (sector.image) {
                    const img = new window.Image()
                    img.src = sector.image

                    const checkDone = () => {
                        loadedCount++
                        if (loadedCount === totalImages) {
                            setImagesLoaded(true)
                        }
                    }

                    img.onload = () => {
                        imagesRef.current[sector.image!] = img
                        checkDone()
                    }
                    img.onerror = () => {
                        console.warn(`Failed to load image: ${sector.image}`)
                        checkDone()
                    }
                }
            })
        }, [sectors])

        /* ===== DRAW WHEEL ===== */
        const drawWheel = () => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            const dpr = window.devicePixelRatio || 1
            const displayedSize = wheelSize

            // Set actual size in memory (scaled to account for extra pixel density)
            canvas.width = displayedSize * dpr
            canvas.height = displayedSize * dpr

            // Normalize coordinate system to use css pixels.
            ctx.scale(dpr, dpr)

            // Center of the wheel (in logical pixels)
            const r = displayedSize / 2

            // Clear entire canvas (using logical coords due to scale)
            ctx.clearRect(0, 0, displayedSize, displayedSize)

            sectors.forEach((sector, i) => {
                const ang = arc * i
                ctx.beginPath()
                ctx.fillStyle = sector.color
                ctx.moveTo(r, r)
                ctx.arc(r, r, r, ang, ang + arc)
                ctx.lineTo(r, r)
                ctx.fill()

                ctx.save()
                ctx.translate(r, r)
                ctx.rotate(ang + arc / 2)
                ctx.textAlign = 'right'
                ctx.fillStyle = sector.text

                // Scale calculations
                const scaleFactor = displayedSize / 500 // Increased base scale to match new size trend
                const fontSize = Math.max(14, labelFontSize * scaleFactor * 1.2)
                ctx.font = `700 ${fontSize}px sans-serif` // Extra Bold
                ctx.textBaseline = 'middle'
                ctx.textAlign = 'center'

                // --- CURVED TEXT ---
                const text = sector.label
                // Radius for the baseline of the text. 
                // Push text slightly further IN from edge to be safe
                const textRadius = r - 45 * scaleFactor 

                ctx.save()
                
                // Calculate total angle subtended by text
                const totalAngle = ctx.measureText(text).width / textRadius
                
                // Start rotation: back up by half the total angle so text is centered
                ctx.rotate(-totalAngle / 2)

                for (let j = 0; j < text.length; j++) {
                    const char = text[j]
                    const charWidth = ctx.measureText(char).width
                    const charAngle = charWidth / textRadius

                    ctx.rotate(charAngle / 2)
                    ctx.save()
                    ctx.translate(textRadius, 0)
                    ctx.rotate(Math.PI / 2)
                    ctx.fillText(char, 0, 0)
                    ctx.restore()
                    ctx.rotate(charAngle / 2)
                }
                ctx.restore()

                // --- IMAGE (ROUNDED) ---
                if (sector.image && imagesRef.current[sector.image]) {
                    const img = imagesRef.current[sector.image]

                    // TEXT
                    // CUSTOMIZABLE: Image Size and Offset
                    // Offset: Distance from CENTER. Larger = Closer to Edge.
                    // Text is at r-45. We want image at r-125 (below text).
                    const imgOffset = r - 120 * scaleFactor // Adjusted gap
                    const imgSize = 80 * scaleFactor // Increased size for better visibility

                    ctx.save()
                    ctx.translate(imgOffset, 0)
                    ctx.rotate(Math.PI / 2) // Point Outwards

                    // Rounded Clip
                    ctx.beginPath()
                    ctx.arc(0, 0, imgSize / 2, 0, Math.PI * 2)
                    ctx.closePath()
                    ctx.clip()

                    ctx.drawImage(img, -imgSize / 2, -imgSize / 2, imgSize, imgSize)
                    ctx.restore()
                }

                ctx.restore()
            })
        }

        const rotateCanvas = () => {
            if (canvasRef.current) {
                canvasRef.current.style.transform = `rotate(${angleRef.current}rad)`
            }
        }

        const getCurrentSector = (): Sector => {
            const adjustedAngle = (angleRef.current + Math.PI / 2) % TAU
            const index =
                Math.floor(
                    sectors.length - (adjustedAngle / TAU) * sectors.length
                ) % sectors.length

            return sectors[index] ?? sectors[0]
        }

        const animate = (time: number) => {
            if (!spinningRef.current || startTimeRef.current === null) return

            const elapsed = time - startTimeRef.current
            const t = Math.min(1, elapsed / spinDuration)
            const eased = (easingFunction || easeOutCubic)(t)

            angleRef.current = targetAngleRef.current * eased
            rotateCanvas()

            if (t < 1) requestAnimationFrame(animate)
            else {
                spinningRef.current = false
                if (audioRef.current) {
                    audioRef.current.pause()
                    audioRef.current.currentTime = 0
                }
                const result = getCurrentSector()
                setWinner(result)
                setShowModal(true)
                onSpinEnd?.(result)
            }
        }

        const handleSpin = async () => {
            try {
                // Block if already spinning or currently processing a request
                if (!canSpin || spinningRef.current || isProcessingRef.current) return
                isProcessingRef.current = true

                // No ID needed, cookie handles it
                const res = await fetch('/api/spin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                })

                const json = await res.json()
                if (json.redeemCode) setRedeemCode(json.redeemCode)

                if (!res.ok) {
                    isProcessingRef.current = false // Reset lock

                    // If already spun, redirect to status
                    if (res.status === 400 && json.error === "Already spun") {
                        window.location.href = `/status?show_story=true`
                        return
                    }
                    if (res.status === 401) {
                        setShowLogin(true)
                        return
                    }
                    alert(json.error || "Spin failed")
                    return
                }

                // Find Prize Index
                const winningIndex = sectors.findIndex(s =>
                    (json.prize.id && s.id === json.prize.id) || s.label === json.prize.label
                )

                if (winningIndex === -1) {
                    console.error("Prize not found in sectors configuration", json.prize)
                    isProcessingRef.current = false // Reset lock
                    return
                }

                trackEvent("spin_result", {
                    prize_label: json.prize.label,
                    redeem_code: json.redeemCode
                })

                // Calculate Target Angle
                const arc = TAU / sectors.length // Ensure arc is available or use prop
                // We want the winner sector to be at the TOP (270 degrees or 3PI/2)
                // Wheel formula: Position = Current_Angle + Sector_Offset
                // We rotate the CANVAS.
                // If we rotate by A, the sector at `idx` (angle `idx*arc`) moves to `idx*arc + A`.
                // We want `idx*arc + A + arc/2 = 3PI/2 (Center of sector at Top)
                // So `A = 3PI/2 - idx*arc - arc/2`.

                const sectorCenterAngle = winningIndex * arc + arc / 2
                let targetRotation = (3 * Math.PI / 2) - sectorCenterAngle

                // Add Random Jitter (optional, keeps it interesting within the sector)
                // const jitter = (Math.random() - 0.5) * (arc * 0.8)
                // targetRotation += jitter

                // Ensure we spin forward by at least 5 rotations
                const currentRotation = angleRef.current
                const minSpins = 5

                // Calculate next target that is > currentRotation + minSpins
                // First, bring targetRotation to be just above currentRotation
                // We want targetRotation = (k * TAU) + baseTarget

                // Make targetRotation positive relative to current?
                // Let's just normalize logic:
                // 1. Get equivalent base angle in 0..TAU
                // const base = (targetRotation % TAU + TAU) % TAU
                // 2. Add full rotations
                // targetAngleRef.current = currentRotation + (minSpins * TAU) + (base - (currentRotation % TAU))
                // Ensure positive diff

                const baseTarget = (targetRotation % TAU + TAU) % TAU // 0 to 2PI
                const currentMod = (currentRotation % TAU + TAU) % TAU

                let diff = baseTarget - currentMod
                if (diff < 0) diff += TAU // Ensure we go forward to reach target

                targetAngleRef.current = currentRotation + (minSpins * TAU) + diff

                startTimeRef.current = performance.now()
                spinningRef.current = true
                isProcessingRef.current = false // Handover lock to spinningRef

                // Play Audio
                if (!audioRef.current) {
                    audioRef.current = new Audio('/audio/spin-wheel-sound.mp3')
                }

                if (isSoundEnabled) {
                    audioRef.current.currentTime = 0
                    audioRef.current.loop = true
                    audioRef.current.play().catch(err => console.error("Audio play failed", err))
                }

                requestAnimationFrame(animate)

            } catch (e) {
                console.error(e)
                spinningRef.current = false
                isProcessingRef.current = false // Reset lock on crash
            }
        }



        useImperativeHandle(ref, () => ({ spin: handleSpin }))

        const getButtonText = () => {
            const label = getCurrentSector().label
            if (typeof spinButtonText === 'function') {
                return spinButtonText(spinningRef.current, label)
            }
            return spinButtonText || 'SPIN'
        }
        useEffect(() => {
            drawWheel()
        }, [labelFontSize, wheelSize, imagesLoaded]) // Re-draw when size changes or images load


        // CHECK SESSION (Server-Side)
        useEffect(() => {
            // If user explicitly asked to switch accounts, show login
            // We need a way to clear the cookie for 'switch'. 
            // For now, we assume switching just means showing login, but we should hit a logout endpoint?
            // Let's implement logout later if needed.
            
            setIsLoadingSession(true)

            fetch('/api/Participant/check')
                .then(res => {
                    if (res.status === 401) {
                        return { authenticated: false }
                    }
                    return res.json()
                })
                .then(data => {
                    if (data.authenticated) {
                        setShowLogin(false)
                        
                        // Update state
                        setHasSpun(data.hasSpun)

                        // Check Terms & Profile FIRST
                        if (!data.termsAgreed) {
                            trackEvent("view_social_gate", { source: "terms_not_agreed" });
                            setShowSocialGate(true)
                        } else if (data.hasSpun) {
                            // If terms agreed but already spun, redirect
                            window.location.href = '/status?show_story=true'
                            return
                        } else {
                             setCanSpin(true)
                        }
                    } else {
                        trackEvent("view_login_modal", { source: "session_check_failed" });
                        setShowLogin(true)
                    }
                })
                .catch(e => {
                    console.error("Session check failed", e)
                    setShowLogin(true)
                })
                .finally(() => setIsLoadingSession(false))

        }, [])



        return (
            <>
                {/* 
                     Only render modal if session check is finished.
                     Otherwise user sees flash of modal before finding out they are logged in.
                */}
                {!isLoadingSession && (
                    <LoginStatusModal
                        isOpen={showLogin}
                        error={urlError}
                        onSuccess={async () => {
                            // Helper to refresh state after login
                            setIsLoadingSession(true);
                            try {
                                const res = await fetch('/api/Participant/check');
                                const data = await res.json();
                                if (data.authenticated) {
                                    setShowLogin(false);
                                    setHasSpun(data.hasSpun);

                                    if (!data.termsAgreed) {
                                        setShowSocialGate(true);
                                    } else if (data.hasSpun) {
                                        window.location.href = '/status?show_story=true';
                                    } else {
                                        setCanSpin(true);
                                    }
                                }
                            } catch(e) { console.error(e) }
                            finally { setIsLoadingSession(false) }
                        }}
                    />
                )}

                {/*  Loading State (Optional: Spinner or just wait) */}
                {isLoadingSession && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                )}


                {/* 
                  TermsModal removed/hidden as per new ClaimPrizeModal flow, 
                  but keeping hook logic if needed or just commenting out effectively. 
                  Actually the original code still has showTerms logic. 
                  Let's keep it but it might be unreachable if we don't set showTerms.
                */}

                {/* <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[url('/x-max-bg.jpg')] object-cover bg-cover bg-center overflow-hidden" */}
                <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[url('/new-year-bg.avif')] object-cover bg-cover bg-center overflow-hidden"
                    style={{
                        // background: 'radial-gradient(circle at center, #D32F2F 0%, #880E4F 100%)', // Premium Gradient
                        paddingBottom: '2rem'
                    }}>

                    <div className='flex flex-col items-center justify-center gap-24'>
                        {/* Brand Logo */}
                        <div className="relative top-4 md:top-8 z-20 w-40 md:w-56 drop-shadow-xl">
                            <Image
                                src="/brand-logo-red.png"
                                alt="Yes Bharath Wedding Collections"
                                width={224}
                                height={80}
                                className="w-full h-auto"
                                priority
                            />
                        </div>
                        {/* Spin Wheel */}
                        <div className='relative flex flex-col items-center justify-center'>
                            <div className="relative transition-all duration-300 ease-out z-10"
                                style={{ width: wheelSize, height: wheelSize }}>

                                {/* Bulbs Container */}
                                <div className="absolute inset-0 pointer-events-none z-10">
                                    {[...Array(24)].map((_, i) => (
                                        <span
                                            key={i}
                                            className={`absolute top-1/2 left-1/2 -ml-2 -mt-2 w-4 h-4 rounded-full bg-[#FFD700] shadow-[0_0_10px_2px_rgba(255,215,0,0.8)]`}
                                            style={{
                                                transform: `rotate(${(360 / 24) * i}deg) translate(${wheelSize / 2 - 5}px)`,
                                                animation: `pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                                                animationDelay: `${i % 2 === 0 ? '0s' : '0.5s'}`
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Wheel Canvas */}
                                <canvas
                                    ref={canvasRef}
                                    width={wheelSize}
                                    height={wheelSize}
                                    style={{ width: wheelSize, height: wheelSize }}
                                    className="rounded-full border-[8px] md:border-[12px] border-[#1B5E20] shadow-2xl z-10"
                                />

                                {/* Spin Button */}
                                {/* Spin Button & Pointer */}
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex items-center justify-center`}
                                    style={{ width: wheelSize * 0.22, height: wheelSize * 0.22 }}>

                                    {/* POINTER (SVG) pointing UP */}
                                    <div className="absolute -top-[24px] left-1/2 -translate-x-1/2 z-50 drop-shadow-lg filter pb-1">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            {/* Larger, sharper pointer */}
                                            <path d="M12 2L4 20H20L12 2Z" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5" strokeLinejoin="round" />
                                            {/* Center dot for style */}
                                            <circle cx="12" cy="18" r="3" fill="#B8860B" />
                                        </svg>
                                    </div>

                                    {/* BUTTON */}
                                    <button
                                        onClick={handleSpin}
                                        className={`w-full h-full rounded-full 
                                            bg-gradient-to-b from-[#b30000] to-[#7a0000]
                                            border-[4px] border-[#FFD700]
                                            text-white font-black tracking-widest uppercase
                                            shadow-[0_0_20px_rgba(255,0,0,0.45),_inset_0_2px_10px_rgba(255,255,255,0.15)]
                                            hover:scale-105 active:scale-95 transition-all duration-200
                                            flex items-center justify-center
                                            ${spinButtonClassName}`}
                                        style={{
                                            fontSize: Math.max(12, spinButtonFontSize * (wheelSize / 450)),
                                        }}
                                    >
                                        <span className="drop-shadow-md">{getButtonText()}</span>
                                    </button>
                                </div>
                            </div>
                            {/* Base Image scaled with wheel */}
                            <div style={{ width: wheelSize * 0.7, marginTop: -wheelSize * 0.05 }} className="relative z-0 pointer-events-none opacity-90">
                                <Image
                                    ref={imgRef}
                                    src="/SpinBase.png"
                                    alt="wheel base"
                                    width={500}
                                    height={500}
                                    className="w-full h-auto"
                                    priority
                                />
                            </div>
                        </div>
                    </div>

                    <ClaimPrizeModal
                        isOpen={showModal}
                        prizeLabel={winner?.label || ''}
                        prizeImage={winner?.image}
                        redeemCondition={winner?.redeemCondition}
                        redeemCode={redeemCode}
                        onClose={() => window.location.href = '/status?show_story=true'} 
                    />

                    <SocialGateModal
                        isOpen={showSocialGate}
                        onComplete={() => {
                            setShowSocialGate(false)
                            if (hasSpun) {
                                window.location.href = '/status?show_story=true'
                            } else {
                                setCanSpin(true)
                            }
                        }}
                    />
                </div>
            </>
        )
    }
)

export default SpinWheel
