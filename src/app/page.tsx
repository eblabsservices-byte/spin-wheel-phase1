import SpinWheel, { Sector } from '@/components/SpinWheel'
import { PRIZES } from '@/lib/prizes'
import TrackVisibility from '@/components/TrackVisibility'
import TrackEngagement from '@/components/TrackEngagement'


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

// ...

export default async function Page() {

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <TrackVisibility componentName="spin_wheel_page">
          <TrackEngagement componentName="spin_wheel_page" />
          <SpinWheel sectors={sectors} />
        </TrackVisibility>
      </Suspense>
    </>
  )
}
