import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Participant from "@/models/Participant";
import { getSession } from "@/lib/session";
import { checkStatusLimit } from "@/lib/ratelimit";

export async function GET(req: Request) {
    try {
        // 1. Rate Check (Looser for Status Polls)
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const { success } = await checkStatusLimit(ip);
        if (!success) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        // 2. Session Check (Replace ID/Phone Query)
        const session = await getSession();
        
        if (!session || !session.participantId) {
             return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        await connectDB();
        
        // 3. Fetch User (Trusted via Cookie)
        const participant = await Participant.findById(session.participantId);

        if (!participant) {
            return NextResponse.json({ authenticated: false, error: "User not found" }, { status: 404 });
        }
        
        // 4. Fetch Redeem Status
        let redeemStatus = 'pending';
        let rejectionReason = null;
        
        if (participant.hasSpun) {
             const redeem = await import("@/models/Redeem").then(m => m.default.findOne({ participantId: participant._id }));
             if (redeem) {
                 redeemStatus = redeem.status;
                 rejectionReason = redeem.rejectionReason;
             }
        }

        // 5. Return Safe Data
        // No PII leakage mechanism (e.g., querying by phone) anymore.
        // Only return data for the logged-in user.
        return NextResponse.json({
            authenticated: true,
            found: true,
            // Obfuscation? Not needed for the own user, but good practice to mask phone
            name: participant.name, 
            phone: participant.phone, // Return full phone for user's own verification
            phoneMasked: participant.phone ? participant.phone.replace(/.(?=.{4})/g, '*') : "No Phone",
            hasSpun: participant.hasSpun,
            prize: participant.prize,
            redeemCode: participant.redeemCode,
            redeemStatus,
            rejectionReason,
            termsAgreed: participant.termsAgreed || false
        });

    } catch (error: any) {
        console.error("CHECK API ERROR:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
