
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { checkRateLimit, checkOtpLimit, checkOtpVerifyBlock } from "@/lib/ratelimit";
import { sendJioOtp } from "@/lib/jio-otp";
import Participant from "@/models/Participant";

export async function POST(req: Request) {
    try {
        const { phone, name } = await req.json();

        // 1. Validate Input
        if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
            return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
        }
        // Block repeated digits (e.g. 9999999999)
        if (/^(\d)\1{9}$/.test(phone)) {
            return NextResponse.json({ error: "Please enter a valid active mobile number" }, { status: 400 });
        }
        if (!name || name.trim().length < 2) {
             return NextResponse.json({ error: "Valid name required" }, { status: 400 });
        }

        // 2. CHECK: Is User Blocked from Verification? (Brute Force Lockout)
        // User requested: "Result: The user cannot try to verify again (brute force logic) and never generate otp until the time expires."
        const verifyBlock = await checkOtpVerifyBlock(`otp_verify:${phone}`);
        if (!verifyBlock.success) {
             return NextResponse.json({ 
                error: "Your account is temporarily blocked due to multiple failed verification attempts. Please try again later."
            }, { status: 429 });
        }

        // 3. Identity Check: Removed per request.
        // Users are allowed to request OTP even if name doesn't match DB.
        // Name will be updated during verification.

        // 4. Rate Limit (Phone based) - Prevent spam & financial loss
        // Limit: 4 OTPs per minute. Block 10 mins on 5th.
        const limit = await checkOtpLimit(`otp_gen:${phone}`);
        
        if (!limit.success) {
            return NextResponse.json({ 
                error: limit.msg || "Too many OTP requests. Please try again in 10 minutes." 
            }, { status: 429 });
        }

        // 5. Send OTP via JIO Service
        // Pass name so new users get created with correct name immediately
        const otpResult = await sendJioOtp(phone, name);
        
        if (!otpResult.success) {
            return NextResponse.json({ error: otpResult.message || "Failed to send OTP" }, { status: 500 });
        }

        // 6. STORE: Save User as Unverified immediately
        // This ensures Admin can see who attempted to login/register
        // Status: phoneVerified: false
        
        // Find existing or create new
        const existingUser = await Participant.findOne({ phone });

        if (!existingUser) {
             // Create new unverified user
             await Participant.create({
                 name: name,
                 phone: phone,
                 phoneVerified: false,
                 authProvider: 'phone',
                 hasSpun: false,
                 termsAgreed: false,
                 ipAddress: req.headers.get("x-forwarded-for") || "unknown",
                 loginHistory: [{
                     ip: req.headers.get("x-forwarded-for") || "unknown",
                     timestamp: new Date()
                 }]
             });
        } else {
             // Update name but DO NOT reset verification status if already true
             // Only update name if the new name is valid and different? 
             // Logic: Trust the latest name provided by user or keep existing.
             // We will update name here to reflect latest attempt.
             existingUser.name = name;
             
             // DO NOT change phoneVerified here. If they were true, stay true.
             // If false, stay false.
             
             await existingUser.save();
        }

        return NextResponse.json({ success: true, message: "OTP Sent" });

    } catch (error) {
        console.error("Send OTP Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
