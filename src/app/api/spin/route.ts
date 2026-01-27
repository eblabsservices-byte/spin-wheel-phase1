import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Participant from "@/models/Participant";
import Contest from "@/models/Contest";
import Redeem from "@/models/Redeem";
import { checkRateLimit } from "@/lib/ratelimit";
import { getSession } from "@/lib/session"; // Import Session Check
import { nanoid } from "nanoid";

/* 
   DETERMINISTIC SPIN LOGIC (USER DEFINED RULES)
... (Comments preserved)
*/

export async function POST(req: Request) {
    try {
        await connectDB();
        
        // 1. Session Check (Authentication)
        const session = await getSession();
        if (!session || !session.participantId) {
             return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
        }

        const participantId = session.participantId; // Trusted ID from Cookie

        // 2. Participant Check
        const user = await Participant.findById(participantId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        
        // Block check
        if (user.blocked) {
             return NextResponse.json({ error: "Account blocked." }, { status: 403 });
        }

        if (user.hasSpun) {
            return NextResponse.json({ 
                error: "Already spun", 
                prize: { label: user.giftLabel },
                redeemCode: user.redeemCode 
            }, { status: 400 });
        }

        // 3. Terms Check (Security Fix)
        if (!user.termsAgreed) {
             return NextResponse.json({ error: "Please agree to rules first." }, { status: 403 });
        }

        // 4. Rate Limit
        const limit = await checkRateLimit(`spin:${user.phone}`);
        if (!limit.success) {
            return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
        }

        // 3. ATOMIC INCREMENT: Get unique Spin Number (N)
        const contestDoc = await Contest.findOne({ active: true });
        if (!contestDoc) return NextResponse.json({ error: "Contest not active" }, { status: 503 });

        // Increment totalSpins and get the new value
        // We do this first to "reserve" the slot.
        const updatedContest = await Contest.findOneAndUpdate(
            { _id: contestDoc._id, active: true },
            { $inc: { totalSpins: 1 } },
            { new: true }
        );

        const N = updatedContest.totalSpins;
        const prizes = updatedContest.prizes;

        // 4. WATERFALL LOGIC (Strict Priority for 50k Spins)
        let selectedId = "p8"; // Default: ₹100 Gift Voucher

        // 1. iPhone 17 (p1) - [150001]
        if (N === 150001) {
            selectedId = "p1";
        }
        // 2. Haier Smart TV (p2) - [45001]
        else if (N === 7200) {
             selectedId = "p2";
        }
        // 3. iBell Airfryer (p3) - Spin = 3001 + (n * 4500), n=0..9
        else if (N >= 3001 && (N - 3001) % 4500 === 0 && N <= 44000) {
             selectedId = "p3";
        }
        // 4. JBL GO Speaker (p4) - Spin = 4000 + (n * 5000), n=0..9
        else if (N >= 4000 && (N - 4000) % 5000 === 0 && N <= 49000) {
             selectedId = "p4";
        }
        // 5. Shirt (p5) - Spin = 101 + (n * 1000), n=0..49
        else if (N >= 101 && (N - 101) % 1000 === 0 && N <= 49500) {
             selectedId = "p5";
        }
        // 6. Saree (p6) - Spin = 501 + (n * 1000), n=0..49
        else if (N >= 501 && (N - 501) % 1000 === 0 && N <= 49500) {
             selectedId = "p6";
        }
        // 7. ₹500 Voucher (p7) - Spin = 50 + (n * 50), n=0..999
        else if (N >= 50 && N % 50 === 0 && N <= 50000) {
             selectedId = "p7";
        }
        // 8. Default (p8) - Any other spin
        else {
             selectedId = "p8";
        }

        // 5. CHECK AVAILABILITY (Safety Net)
        // Even if logic says YES, check if Item is actually enabled/in-stock in DB.
        // This handles manual admin overrides or weird edge cases.
        let prize = prizes.find((p: any) => p.id === selectedId);

        if (!prize || prize.quantity <= 0) {
            // Fallback to p8 (Unlimited)
            console.warn(`Spin #${N} selected ${selectedId} but out of stock. Fallback to p8.`);
            prize = prizes.find((p: any) => p.id === "p8");
        }

        // 6. DECREMENT STOCK
        // We don't need a loop here because we already "owned" the Spin N.
        await Contest.findOneAndUpdate(
            { _id: contestDoc._id, "prizes.id": prize.id },
            { $inc: { "prizes.$.quantity": -1, "prizes.$.count": 1 } }
        );

        // 7. Update User & Create Redeem
        const codeSuffix = nanoid(6).toUpperCase();
        const redeemCode = `YB-${codeSuffix}`;

        user.hasSpun = true;
        user.prize = prize.id;
        user.giftLabel = prize.label;
        user.redeemCode = redeemCode;
        await user.save();

        await Redeem.create({
            participantId: user._id,
            prizeId: prize.id,
            prizeLabel: prize.label,
            status: 'pending',
            contact: { name: user.name, phone: user.phone },
            // Store specific condition if relevant for display later
        });

        return NextResponse.json({
            won: true,
            prize: { 
                id: prize.id, 
                label: prize.label,
                redeemCondition: prize.redeemCondition // Return for UI
            },
            angle: prize.angle,
            redeemCode
        });

    } catch (error) {
        console.error("Spin Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
