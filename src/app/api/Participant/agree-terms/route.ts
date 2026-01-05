import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Participant from "@/models/Participant";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
    try {
        const session = await getSession();

        if (!session || !session.participantId) {
             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const participant = await Participant.findByIdAndUpdate(
            session.participantId,
            { 
                termsAgreed: true,
                termsAgreedAt: new Date()
            },
            { new: true }
        );

        if (!participant) {
            return NextResponse.json({ error: "Participant not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, termsAgreed: true });

    } catch (error: any) {
        console.error("TERMS AGREE ERROR:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
