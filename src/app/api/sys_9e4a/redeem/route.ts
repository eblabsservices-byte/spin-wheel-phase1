import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Redeem from "@/models/Redeem";
import { isAuthenticated } from "@/lib/auth";

export async function PUT(req: Request) {
    // Auth Check
    const isAuth = await isAuthenticated(req);
    if (!isAuth) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const { participantId, status, rejectionReason } = await req.json();

        if (!participantId || !status) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const updateData: any = { status };
        if (status === 'rejected' && rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }

        // Update Redeem Status
        const updated = await Redeem.findOneAndUpdate(
            { participantId: participantId },
            updateData,
            { new: true, upsert: true } // Upsert if somehow missing? No, should exist.
        );

        if (!updated) {
            return NextResponse.json({ error: "Redeem record not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updated });

    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
