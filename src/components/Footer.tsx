
import React from 'react';

export default function Footer() {
    return (
        <footer className="w-full bg-black/80 backdrop-blur-sm border-t border-white/10 py-4 pb-4 z-40 relative">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-center items-center gap-2 md:gap-6 text-center">
                <p className="text-gray-400 text-xs md:text-sm">
                    Yes Bharath Wedding Collections Sulthan Bathery Lucky Wheel Event 2025
                </p>
                <div className="hidden md:block w-px h-4 bg-gray-600"></div>
                <p className="text-gray-400 text-xs md:text-sm">
                    Developed by <a href="https://www.linkedin.com/in/firdous-n-5165a2257/" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 font-medium transition-colors">Firdous N</a>
                </p>
            </div>
        </footer>
    );
}