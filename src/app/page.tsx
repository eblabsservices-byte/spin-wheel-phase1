'use client'

// import { useRef, useState } from 'react'
// import gsap from 'gsap'
// import { useRouter } from 'next/navigation'

// export default function SpinnerPage() {
//   const wheelRef = useRef(null)
//   const [spinning, setSpinning] = useState(false)
//   const router = useRouter()

//   const spinWheel = async () => {
//     if (spinning) return
//     setSpinning(true)

//     // 1️⃣ Get prize from server
//     const res = await fetch('/api/spin', { method: 'POST' })
//     const data = await res.json()

//     const prize = data.prize

//     // 2️⃣ Map prize → angle (example)
//     const prizeAngles = {
//       '₹100 Cashback': 45,
//       'Shirt': 90,
//       'Saree': 135,
//       'Better Luck Next Time': 180,
//       'iPhone': 270
//     }

//     const angle = prizeAngles[prize] || 0

//     // 3️⃣ Spin animation
//     gsap.to(wheelRef.current, {
//       rotation: 360 * 5 + angle,
//       duration: 4,
//       ease: 'power4.out',
//       onComplete: () => {
//         router.push(`/redeem?prize=${encodeURIComponent(prize)}`)
//       }
//     })
//   }

//   return (
//     <div className="flex flex-col items-center justify-center h-screen">
//       <div
//         ref={wheelRef}
//         className="w-64 h-64 rounded-full border-8 border-red-500 bg-yellow-300 flex items-center justify-center"
//       >
//         🎡
//       </div>

//       <button
//         onClick={spinWheel}
//         className="mt-8 px-6 py-3 bg-green-600 text-white rounded-lg"
//       >
//         SPIN NOW
//       </button>
//     </div>
//   )
// }

'use client'
import SpinWheel, { Sector } from '@/components/SpinWheel'
import { PRIZES } from '@/lib/prizes'


// Map PRIZES to Sectors
const sectors: Sector[] = PRIZES.map(p => ({
  id: p.id,
  color: p.color,
  text: '#000',
  label: p.label,
  image: p.image,
  redeemCondition: p.redeemCondition
}))
// snowflake images


import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <SpinWheel sectors={sectors} />
    </Suspense>
    </>
  )
}
