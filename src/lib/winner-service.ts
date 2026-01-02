import { connectDB } from "@/lib/mongodb";
import { WinnerStory } from "@/models/WinnerStory";

export async function getWinnerStories() {
  try {
    await connectDB();
    const stories = await WinnerStory.find({})
      .sort({ priority: 1, uploadedAt: -1 })
      .limit(50) // Fetch enough for intro slideshow
      .lean(); // Return plain JS objects
    
    // Convert _id and Dates to strings for serialization
    return stories.map((story: any) => ({
      ...story,
      _id: story._id.toString(),
      uploadedAt: story.uploadedAt?.toISOString() || new Date().toISOString()
    }));
  } catch (error) {
    console.error("Failed to fetch winner stories:", error);
    return [];
  }
}
