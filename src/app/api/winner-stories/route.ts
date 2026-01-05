import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WinnerStory } from "@/models/WinnerStory";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    // Sort by priority (asc) then date (desc)
    const stories = await WinnerStory.find({}).sort({ priority: 1, uploadedAt: -1 }).limit(50); 
    // Limit to 50 for now, can add pagination if needed. User mentioned "8-14 pic per sec", so 50 is plenty for initial load.
    
    return NextResponse.json({ data: stories });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 });
  }
}
