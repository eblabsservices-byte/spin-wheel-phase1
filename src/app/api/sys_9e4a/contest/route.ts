
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Contest from "@/models/Contest";
import Participant from "@/models/Participant";
import { getPrizeById } from "@/lib/prizes"; // Use static definition for fallback images/colors if needed

export async function GET() {
    try {
        await connectDB();

        // 1. Get Active Contest
        const contest = await Contest.findOne({ active: true });
        
        // 2. Get Total Participants (All entries)
        const totalParticipants = await Participant.countDocuments();
        
        // 3. Get Verified Participants
        const totalVerified = await Participant.countDocuments({ phoneVerified: true });

        if (!contest) {
            return NextResponse.json({ error: "No active contest found" }, { status: 404 });
        }

        // 4. Format Prizes with Static Data (Images, etc.)
        // Merge DB data (quantities) with Static data (Correct Images/Labels)
        // This ensures Dashboard uses the latest image paths even if DB is stale.
        const dbPrizes = contest.prizes;
        const mergedPrizes = dbPrizes.map((p: any) => {
             const staticPrize = getPrizeById(p.id);
             return {
                 ...p.toObject(), // Convert mongoose doc to object
                 image: staticPrize?.image || p.image, // Prefer static image
                 label: staticPrize?.label || p.label,
                 color: staticPrize?.color || p.color
             };
        });
        
        return NextResponse.json({
            prizes: mergedPrizes,
            totalSpins: contest.totalSpins,
            totalParticipants,
            totalVerified
        });

    } catch (error) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
