import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Participant from "@/models/Participant";
import { getSession } from "@/lib/session";
import { checkProfileUpdateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
    try {
        // 1. Session Check
        const session = await getSession();
        if (!session || !session.participantId) {
             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Rate Limit
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const { success } = await checkProfileUpdateLimit(ip);
        if (!success) {
             return NextResponse.json({ error: "Too many update attempts. Try again later." }, { status: 429 });
        }

        // 3. Input Validation
        const { name, phone } = await req.json();

        if (!name || name.trim().length < 2) {
             return NextResponse.json({ error: "Valid name is required." }, { status: 400 });
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phone || !phoneRegex.test(phone)) {
             return NextResponse.json({ error: "Valid 10-digit mobile number is required." }, { status: 400 });
        }
        
        // Block repeated digits (e.g. 9999999999)
        if (/^(\d)\1{9}$/.test(phone)) {
            return NextResponse.json({ error: "Please enter a valid active mobile number." }, { status: 400 });
        }

        await connectDB();
        
        // 4. Update Participant
        const participant = await Participant.findById(session.participantId);
        if (!participant) {
             return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if phone is already taken by ANOTHER user
        const existingPhone = await Participant.findOne({ phone: phone, _id: { $ne: participant._id } });
        if (existingPhone) {
             return NextResponse.json({ error: "This phone number is already registered." }, { status: 409 });
        }

        participant.name = name.trim();
        participant.phone = phone;
        // Mark as phone verified since we are trusting the user entry post-google-auth (User Requirement)
        // Ideally we would OTP verify this new number, but user said "no OTP".
        // So we trust it for contact purposes.
        
        await participant.save();

        return NextResponse.json({ success: true, message: "Profile updated" });

    } catch (error) {
        console.error("Profile Update Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
