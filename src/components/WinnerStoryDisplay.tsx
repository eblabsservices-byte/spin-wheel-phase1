"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy } from "lucide-react";

export default function WinnerStoryDisplay({
    isOpen,
    onClose,
    stories = [],
    isManualTrigger = false,
    isLoading = false
}: {
    isOpen: boolean;
    onClose: () => void;
    stories?: any[];
    isManualTrigger?: boolean;
        isLoading?: boolean;
}) {

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <IntroOverlay
                    stories={stories}
                    onSkip={onClose}
                    isManualTrigger={isManualTrigger}
                    isLoading={isLoading}
                />
            )}
        </AnimatePresence>
    )
}

function IntroOverlay({ stories, onSkip, isManualTrigger, isLoading }: { stories: any[], onSkip: () => void, isManualTrigger: boolean, isLoading: boolean }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const BATCH_SIZE = 12;

    // Cycle stories logic
    useEffect(() => {
        if (stories.length <= BATCH_SIZE) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + BATCH_SIZE) % stories.length);
        }, 1250);

        return () => clearInterval(interval);
    }, [stories.length]);

    // LOADING STATE
    if (isLoading && stories.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 overflow-hidden"
            >
                <button
                    onClick={onSkip}
                    className="absolute top-8 right-8 text-white/70 hover:text-white flex items-center gap-2 border border-white/20 hover:border-white/50 bg-white/5 rounded-full px-5 py-2 transition z-50 group"
                >
                    <span className="text-sm font-bold uppercase tracking-wider">Close</span>
                    <X size={16} className="group-hover:rotate-90 transition" />
                </button>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mb-4"></div>
                <p className="text-white/70 animate-pulse">Loading Winners...</p>
            </motion.div>
        )
    }

    // EMPTY STATE (Not loading, but no stories)
    if (stories.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 overflow-hidden"
            >
                <button
                    onClick={onSkip}
                    className="absolute top-8 right-8 text-white/70 hover:text-white flex items-center gap-2 border border-white/20 hover:border-white/50 bg-white/5 rounded-full px-5 py-2 transition z-50 group"
                >
                    <span className="text-sm font-bold uppercase tracking-wider">Close</span>
                    <X size={16} className="group-hover:rotate-90 transition" />
                </button>
                <div className="flex justify-center mb-4">
                    <Trophy className="text-gray-600 w-16 h-16" />
                </div>
                <h3 className="text-2xl text-white font-bold mb-2">No Winners Yet</h3>
                <p className="text-gray-400">Stay tuned! Results will be announced soon.</p>
            </motion.div>
        )
    }

    // get current batch
    const currentBatch = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
        const index = (currentIndex + i) % stories.length;
        currentBatch.push(stories[index]);
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 overflow-hidden"
        >
            {/* Confetti / Decor */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-600 via-transparent to-transparent"></div>

            <button
                onClick={onSkip}
                className="absolute top-8 right-8 text-white/70 hover:text-white flex items-center gap-2 border border-white/20 hover:border-white/50 bg-white/5 rounded-full px-5 py-2 transition z-50 group"
            >
                <span className="text-sm font-bold uppercase tracking-wider">
                    {isManualTrigger ? "Close" : "Skip Intro"}
                </span>
                <X size={16} className="group-hover:rotate-90 transition" />
            </button>

            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-8 md:mb-12 z-10"
            >
                <div className="flex flex-col items-center gap-2 mb-8 md:mb-12">
                    <img src="/brand-logo-white.jpg" alt="Brand Logo" className="w-50 md:w-55 mb-4 rounded-lg shadow-2xl" />
                    <div className="flex justify-center mb-4">
                        <Trophy className="text-yellow-400 w-16 h-16 animate-bounce" />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-2">
                        WINNERS GALLERY
                    </h2>
                    <p className="text-yellow-400 font-medium tracking-widest uppercase">Celebrating Our winners</p>
                </div>
                {/* <div className="inline-block px-6 py-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 backdrop-blur-sm"> */}
                <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl max-w-lg w-full">

                    {/* <p className="text-yellow-300 font-bold tracking-wider text-sm md:text-base animate-pulse">
                        🎊 Contest Ends in {Math.max(0, Math.ceil((new Date("2026-02-06").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} Days 🎊
                    </p> */}
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)]">
                        EVENT <span className="text-red-500">ENDED</span>
                    </h1>
                    <p className="text-gray-300 text-lg mb-8">
                        Thank you to all our participants! <br />
                        The Lucky Wheel event has concluded.
                    </p>

                </div>
            </motion.div>
            {/* Dynamic Cards Animation */}
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl z-10 px-4 min-h-[300px] content-center">
                <AnimatePresence mode="popLayout">
                    {currentBatch.map((s, i) => (
                        <motion.div
                            key={`${s._id}-${currentIndex}-${i}`} // Key changes to force re-render animation AND be unique
                            initial={{ scale: 0, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0, opacity: 0, y: -20 }}
                            transition={{ delay: i * 0.03, type: "spring", stiffness: 200, damping: 20 }}
                            className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-xl overflow-hidden border-2 border-white/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-white relative group"
                        >
                            <img src={s.imageUrl} className="w-full h-full object-cover" alt={s.prizeLabel} />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                                <span className="text-white font-bold text-[10px] md:text-xs bg-black/50 px-2 py-1 rounded backdrop-blur-md whitespace-nowrap">{s.prizeLabel}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

        </motion.div>
    )
}