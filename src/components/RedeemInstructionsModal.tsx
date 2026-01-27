"use client"
import React from "react"
import { motion, AnimatePresence } from "framer-motion"

interface RedeemInstructionsModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function RedeemInstructionsModal({ isOpen, onClose }: RedeemInstructionsModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <AnimatePresence>
                <div key="backdrop" onClick={onClose} className="absolute inset-0"></div>
                <motion.div
                    key="modal"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative z-10"
                >
                    <div className="h-2 bg-yellow-400" />
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            🏬
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">How to Claim Your Prize</h2>
                        <p className="text-gray-500 text-sm mb-6">
                            Follow these simple steps to collect your gift!
                        </p>

                        <div className="space-y-4 text-left bg-gray-50 p-4 rounded-xl mb-6">
                            <div className="flex gap-3">
                                <div className="bg-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow text-gray-700">1</div>
                                <p className="text-sm text-gray-700">Visit <strong>Yes Bharath Wedding Collections Sulthan Bathery</strong> Showroom.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow text-gray-700">2</div>
                                <p className="text-sm text-gray-700">Show this <strong>Status Page</strong> to the counter staff.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow text-gray-700">3</div>
                                <p className="text-sm text-gray-700">Staff will verify your code and handover the gift.</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-yellow-400 text-yellow-900 font-bold rounded-xl hover:bg-yellow-500 transition"
                        >
                            Got it!
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
