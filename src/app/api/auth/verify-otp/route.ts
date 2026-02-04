
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Participant from "@/models/Participant";
import { verifyJioOtp } from "@/lib/jio-otp";
import { createSession } from "@/lib/session";
import { checkOtpVerifyBlock, incrementOtpVerifyFailure } from "@/lib/ratelimit";

export async function POST(req: Request) {
    try {
        const { phone, otp, name } = await req.json();

        // 1. Validate Input
        if (!phone || !otp) {
            return NextResponse.json({ error: "Missing required fields (Phone/OTP)" }, { status: 400 });
        }

        // 2. Brute Force Protection (Check Block Status)
        // Key: `otp_verify:{phone}`
        const limit = await checkOtpVerifyBlock(`otp_verify:${phone}`);
        if (!limit.success) {
            return NextResponse.json({ 
                error: limit.msg || "Too many failed attempts. Account blocked for 15 minutes." 
            }, { status: 429 });
        }

        // 3. Verify OTP via JIO Service
        const jioResult = await verifyJioOtp(phone, otp);
        if (!jioResult.success) {
             // Increment Failure Count
             await incrementOtpVerifyFailure(`otp_verify:${phone}`);
             return NextResponse.json({ error: jioResult.message || "Invalid OTP" }, { status: 400 });
        }

        await connectDB();

        // Retrieve Trusted Name from OTP Validation Result (stored in MongoDB Otp doc)
        // This is the name the user entered when they requested the OTP.
        const trustedName = jioResult.name;

        // 3. Find or Create User
        let user = await Participant.findOne({ phone });

        if (!user) {
            const finalName = name || trustedName;

            if (!finalName) {
                return NextResponse.json({ error: "Name required for new user" }, { status: 400 });
            }
            
            // Create New User (No Fingerprint)
            user = await Participant.create({
                name: finalName,
                phone,
                phoneVerified: true, // Phone verified via OTP
                authProvider: 'phone',
                hasSpun: false,
                termsAgreed: false,
                // Removed Security Fields
                ipAddress: req.headers.get("x-forwarded-for") || "unknown",
                loginHistory: [{
                    ip: req.headers.get("x-forwarded-for") || "unknown",
                    timestamp: new Date()
                }]
            });
        } else {
             // Existing User: VALIDATE DEVICE - REMOVED PER REQUEST
             // "ClentFingerprint remove DeviceFingerprint compleatly from code"

             // UPDATE NAME: If provided in request, update the DB record
             if (name && name.trim().length > 0) {
                 user.name = name;
             }
             
             // Mark as verified since they passed OTP
             user.phoneVerified = true;
             
             // Update History
             user.loginHistory.push({
                 ip: req.headers.get("x-forwarded-for") || "unknown",
                 timestamp: new Date()
             });
             user.ipAddress = req.headers.get("x-forwarded-for") || "unknown"; // Update last IP
             await user.save();
        }

        // 4. Create Session (HttpOnly Cookie)
        await createSession({
            participantId: user._id.toString(),
            version: 1, // session version
            role: 'user'
        });

        // 5. Return User Data (Sanitized)
        return NextResponse.json({
            success: true,
            user: {
                participantId: user._id, 
                name: user.name,
                phone: user.phone, // Safe to return to owner
                hasSpun: user.hasSpun
            }
        });

    } catch (error) {
        console.error("Verify OTP Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
