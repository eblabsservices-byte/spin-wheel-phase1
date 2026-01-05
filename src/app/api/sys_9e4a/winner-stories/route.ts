import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WinnerStory } from "@/models/WinnerStory";

export const dynamic = 'force-dynamic';

const PRIORITY_MAP: Record<string, number> = {
  'iPhone 17': 1,
  'Haier Smart TV': 2,
  'iBell Airfryer': 3,
  'JBL GO Speaker': 4,
  'Shirt': 5,
  'Saree': 6,
  '₹500 Voucher': 7,
  '₹100 Voucher': 8,
  'Voucher': 8
};

// GET: List all stories
export async function GET() {
  try {
    await connectDB();
    const stories = await WinnerStory.find({}).sort({ priority: 1, uploadedAt: -1 });
    return NextResponse.json({ data: stories });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 });
  }
}

// POST: Add new stories (Bulk)
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { images, prizeLabel } = body; 
    
    if (!images || !Array.isArray(images) || !prizeLabel) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const priority = PRIORITY_MAP[prizeLabel] || 99;

    const newStories = images.map((img: string) => ({
      imageUrl: img,
      prizeLabel,
      priority,
      uploadedAt: new Date()
    }));

    await WinnerStory.insertMany(newStories);

    return NextResponse.json({ success: true, count: newStories.length });
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Remove a story
export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "No ID" }, { status: 400 });

    await WinnerStory.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
