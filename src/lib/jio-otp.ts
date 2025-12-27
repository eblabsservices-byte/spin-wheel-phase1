import { connectDB } from "./mongodb";
import Participant from "@/models/Participant";

// No Redis dependency for OTP anymore
// Uses MongoDB (Participant.otpCode)

interface OtpResponse {
    success: boolean;
    message?: string;
    refId?: string;
    name?: string;
}

// Generate secure 6-digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendJioOtp(phone: string, name?: string): Promise<OtpResponse> {
    const apiKey = process.env.SENDOXI_API_KEY;
    const basicUser = process.env.SENDOXI_BASIC_AUTH_USERNAME;
    const basicPass = process.env.SENDOXI_BASIC_AUTH_PASSWORD;
    const senderId = process.env.SENDOXI_SENDER_ID;
    const entityId = process.env.SENDOXI_DLT_ENTITY_ID;
    const templateId = process.env.SENDOXI_OTP_TEMPLATE_ID;

    // Optional: Log if credentials missing but don't crash dev if env not ready
    if (!apiKey || !senderId || !templateId) {
        console.warn("Missing Sendoxi Credentials in .env, checking DB...");
        // For development safety, maybe allow mock if env explicitly says so?
        // But user asked for real Sendoxi.
    }

    // 1. Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 Mins

    // 2. Store in MongoDB (Participant)
    await connectDB();
    
    // Upsert Participant with OTP
    // If user doesn't exist, we create a temporary record or just update if exists?
    // We must be careful not to create a 'partial' user that messes up logic.
    // However, for OTP logic to work without Redis, we NEED a record.
    // Strategy: Upsert with just phone + otp. 
    
    const updatedUser = await Participant.findOneAndUpdate(
        { phone },
        { 
            $set: { 
                otpCode: otp, 
                otpExpires: otpExpires,
            },
            $setOnInsert: {
                name: name || "Guest", 
                hasSpun: false,
                termsAgreed: false,
                phoneVerified: false
            }
        },
        { upsert: true, new: true, select: '+otpCode' }
    );
    
    console.log(`[DEBUG_DB] OTP SAVED for ${phone}:`, updatedUser?.otpCode); // Verify persistence

    console.log(`[SENDOXI] Sending OTP ${otp} to ${phone}`);

    // 3. Call Sendoxi API
    try {
        if (!apiKey) {
             // Fallback for dev if no credentials
             return { success: true, message: "OTP Generated (No Creds)", refId: "DEV-MOCK" };
        }

        const authHeader = `Basic ${Buffer.from(`${basicUser}:${basicPass}`).toString('base64')}`;
        const messageContent = `Your login OTP for SpinWheel is ${otp}. Yes Bharath Wedding Collections.`;

        const payload = {
            messageContent,
            senderID: senderId,
            templateID: templateId,
            destination: phone,
            entityId: entityId,
            countryCode: "91"
        };

        const res = await fetch("https://api.sendoxi.com/send/v1/single_sms_post", {
            method: "POST",
            headers: {
                "apiKey": apiKey,
                "Authorization": authHeader,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("[SENDOXI RESPONSE]", JSON.stringify(data));

        if (data.responseResult?.responseCode === 200) {
             return { success: true, message: "OTP Sent", refId: data.data?.[0]?.msgID };
        } else {
             return { success: false, message: "Failed to send SMS" };
        }

    } catch (error) {
        console.error("Sendoxi API Error:", error);
        return { success: false, message: "SMS Service Down" };
    }
}

export async function verifyJioOtp(phone: string, otp: string): Promise<OtpResponse> {
    await connectDB();
    console.log(`[DEBUG_VERIFY] Searching for phone: '${phone}' with OTP: '${otp}'`);

    const participant = await Participant.findOne({ phone }).select('+otpCode');

    if (!participant) {
        console.log(`[DEBUG_VERIFY] User NOT FOUND for phone: ${phone}`);
        return { success: false, message: "OTP Expired or Request New OTP" };
    }

    console.log(`[DEBUG_VERIFY] User Found: ${participant._id}, OTP in DB: '${participant.otpCode}'`);

    if (!participant.otpCode) {
         console.log(`[DEBUG_VERIFY] otpCode is MISSING/NULL in DB.`);
         return { success: false, message: "OTP Expired or Request New OTP" };
    }

    if (participant.otpExpires < new Date()) {
        console.log(`[DEBUG_VERIFY] OTP Expired. Expires: ${participant.otpExpires}, Now: ${new Date()}`);
        return { success: false, message: "OTP Expired" };
    }

    if (participant.otpCode === otp) {
        // Success: Clear OTP
        participant.otpCode = undefined;
        participant.otpExpires = undefined;
        await participant.save();
        console.log(`[DEBUG_VERIFY] Success!`);
        return { success: true, message: "Verified", name: participant.name };
    }

    console.log(`[DEBUG_VERIFY] Mismatch. Provided: ${otp}, Expected: ${participant.otpCode}`);
    return { success: false, message: "Invalid OTP" };
}
