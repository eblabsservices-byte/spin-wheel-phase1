import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-32 h-32 animate-pulse">
        <Image
          src="/brand-logo-red.png"
          alt="Loading..."
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain"
          priority
        />
      </div>
      <div className="mt-8 flex items-center justify-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#FFD700] animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-3 h-3 rounded-full bg-[#FFD700] animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-3 h-3 rounded-full bg-[#FFD700] animate-bounce"></div>
      </div>
      <p className="mt-4 text-white/80 font-medium tracking-widest text-sm uppercase">
        Loading...
      </p>
    </div>
  );
}
