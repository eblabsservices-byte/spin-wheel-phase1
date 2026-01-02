"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { trackEvent } from "@/hooks/useAnalytics"

interface ClaimPrizeModalProps {
    isOpen: boolean
    prizeLabel: string
    prizeImage?: string
    redeemCode: string
    redeemCondition?: string
    onClose: () => void
}

export default function ClaimPrizeModal({ isOpen, prizeLabel, prizeImage, redeemCode, redeemCondition, onClose }: ClaimPrizeModalProps) {
    const [step, setStep] = useState<"reveal" | "code">("reveal")

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden text-center relative"
                >
                    {/* Header Gradient */}
                    <div className="h-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />

                    <div className="p-8 pt-6">
                        {/* STEP 1: REVEAL */}
                        {step === "reveal" && (
                            <>
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    className="mb-4 flex justify-center"
                                >
                                    {prizeImage ? (
                                        <div className="relative w-32 h-32 rounded-full border-4 border-yellow-400 shadow-xl overflow-hidden bg-white">
                                            <img src={prizeImage} alt={prizeLabel} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="text-6xl">🎉</div>
                                    )}
                                </motion.div>

                                <h2 className="text-2xl font-black text-gray-800 mb-1 uppercase tracking-wide">
                                    Congratulations!
                                </h2>
                                <p className="text-gray-600 mb-4 text-sm">You have won a</p>

                                <div className="text-2xl font-bold text-red-600 mb-4 p-3 bg-red-50 rounded-xl border border-red-100 shadow-inner">
                                    {prizeLabel}
                                </div>

                                {redeemCondition && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-left shadow-sm">
                                        <div className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-1">
                                            ⚠️ Redeem Condition:
                                        </div>
                                        <div className="text-sm text-yellow-900 font-medium leading-tight">
                                            {redeemCondition}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        trackEvent("prize_claimed", {
                                            prize_label: prizeLabel,
                                            redeem_code: redeemCode,
                                        })
                                        setStep("code")
                                    }}
                                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg transform transition active:scale-95 text-lg"
                                >
                                    CLAIM PRIZE
                                </button>
                            </>
                        )}

                        {/* STEP 2: REDEEM CODE */}
                        {step === "code" && (
                            <>
                                <div className="text-green-500 text-5xl mb-4">✅</div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    Here is your Code!
                                </h2>
                                <p className="text-gray-600 text-sm mb-6">
                                    Take a screenshot and show this at the counter.
                                </p>

                                <div className="bg-gray-900 text-white font-mono text-3xl font-bold py-4 rounded-xl mb-6 relative group cursor-pointer border-2 border-dashed border-gray-700">
                                    {redeemCode || "YB-LOADING"}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-xl text-sm font-sans">
                                        Screenshot This
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-yellow-400 text-yellow-900 font-bold rounded-xl hover:bg-yellow-500 transition"
                                >
                                    View Status Report
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
