import { connectDB } from "./mongodb";
import Participant from "@/models/Participant";
import OtpStore from "@/models/OtpStore";

// OTP Logic decoupled from Participant
// Uses MongoDB (OtpStore)

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
    }

    // 1. Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 Mins

    // 2. Store in MongoDB (OtpStore) - Temporary Storage
    await connectDB();
    
    // Upsert into OTP Store
    const updatedOtp = await OtpStore.findOneAndUpdate(
        { phone },
        { 
            $set: { 
                otpCode: otp, 
                expiresAt: otpExpires,
                tempName: name || "Guest"
            }
        },
        { upsert: true, new: true }
    );
    
    console.log(`[DEBUG_DB] OTP SAVED in OtpStore for ${phone}:`, updatedOtp?.otpCode);

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

    // 1. Check OtpStore first
    const storedOtp = await OtpStore.findOne({ phone });

    if (!storedOtp) {
        console.log(`[DEBUG_VERIFY] No OTP found in OtpStore for: ${phone}`);
        return { success: false, message: "OTP Expired or Request New OTP" };
    }

    // 2. Validate
    if (storedOtp.otpCode !== otp) {
        console.log(`[DEBUG_VERIFY] Mismatch. Provided: ${otp}, Expected: ${storedOtp.otpCode}`);
        return { success: false, message: "Invalid OTP" };
    }

    console.log(`[DEBUG_VERIFY] Success!`);

    // 3. Cleanup OTP
    const nameToUse = storedOtp.tempName;
    await OtpStore.deleteOne({ _id: storedOtp._id });

    return { success: true, message: "Verified", name: nameToUse };
}
