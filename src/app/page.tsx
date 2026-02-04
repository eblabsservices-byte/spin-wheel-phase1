import SpinWheel, { Sector } from '@/components/SpinWheel'
import { PRIZES } from '@/lib/prizes'

export const dynamic = 'force-dynamic'
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

import { getSession } from "@/lib/session"
import { connectDB } from "@/lib/mongodb"
import Participant from "@/models/Participant"
import EventEndedView from "@/components/EventEndedView"

export default async function Page() {

  // Server-Side Session Check
  let initialSessionData = { authenticated: false, hasSpun: false, termsAgreed: false }

  try {
    const session = await getSession();
    if (session && session.participantId) {
      await connectDB();
      const user = await Participant.findById(session.participantId).select('hasSpun termsAgreed').lean();
      if (user) {
        initialSessionData = {
          authenticated: true,
          hasSpun: user.hasSpun,
          termsAgreed: user.termsAgreed
        }
      }
    }
  } catch (error) {
    console.error("Home Page Session Check Failed", error);
    // Fallback to client-side check if server fails
  }

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <TrackVisibility componentName="spin_wheel_page">
          <TrackEngagement componentName="spin_wheel_page" />
          {/* Check Event End Time: 03-02-2026 6:00 PM IST */}
          {new Date() > new Date("2026-02-03T18:00:00+05:30") ? (
            <EventEndedView initialSessionData={initialSessionData} />
          ) : (
              <SpinWheel sectors={sectors} initialSessionData={initialSessionData} />
          )}
        </TrackVisibility>
      </Suspense>
    </>
  )
}
