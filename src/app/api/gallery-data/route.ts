import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WinnerStory } from "@/models/WinnerStory";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = parseInt(searchParams.get('skip') || '0');

        // Sort by priority (asc) then date (desc)
        const stories = await WinnerStory.find({})
            .sort({ priority: 1, uploadedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Faster execution, returns plain JS objects

        return NextResponse.json({ data: stories }, {
            headers: {
                // Cache for 60 seconds, allow slate data for 5 minutes
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
            }
        });
    } catch (error) {
        console.error("Error fetching winner stories:", error);
        return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 });
    }
}
