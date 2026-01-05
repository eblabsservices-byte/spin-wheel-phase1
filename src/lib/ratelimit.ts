import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import RateLimit from "@/models/RateLimit";
import { connectDB } from "@/lib/mongodb";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = (redisUrl && redisToken && redisUrl.startsWith("http")) ? Redis.fromEnv() : null;

// Helper to handle strict blocking with MongoDB fallback
async function checkStrictLimit(identifier: string, limitCount: number, windowSeconds: number, blockDurationSeconds: number) {
    try {
        await connectDB();
        const now = new Date();

        // 1. Check for existing record
        let record = await RateLimit.findOne({ key: identifier });

        // 2. Check Block
        if (record && record.blockedUntil && record.blockedUntil > now) {
             const remainingBlock = Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000);
             return { success: false, blocked: true, msg: `Too many attempts. Blocked for ${Math.ceil(remainingBlock / 60)} minutes.` };
        }

        // 3. Clean up expired record if it exists but isn't blocked (Fixed Window Reset)
        if (record && record.expiresAt < now && !record.blockedUntil) {
             await RateLimit.deleteOne({ _id: record._id });
             record = null;
        }

        // 4. Atomic Upsert & Increment
        // This ensures that even with parallel requests, we increment accurately.
        record = await RateLimit.findOneAndUpdate(
            { key: identifier },
            { 
                $inc: { count: 1 },
                $setOnInsert: { 
                    expiresAt: new Date(now.getTime() + windowSeconds * 1000)
                }
            },
            { upsert: true, new: true }
        );

        console.log(`[RateLimit] Key: ${identifier} | Count: ${record.count} | Limit: ${limitCount}`);

        // 5. Check Limit
        if (record.count > limitCount) {
             console.warn(`[SECURITY] Blocking ${identifier} for ${blockDurationSeconds}s.`);
             
             // Apply Block
             record.blockedUntil = new Date(now.getTime() + blockDurationSeconds * 1000);
             record.expiresAt = new Date(now.getTime() + blockDurationSeconds * 1000 + 60000); // Keep doc alive
             await record.save();

             return { success: false, blocked: true, msg: `Limit exceeded. Blocked for ${Math.ceil(blockDurationSeconds / 60)} minutes.` };
        }

        return { success: true, remaining: limitCount - record.count };

    } catch (error) {
        console.error("Rate Limit Error (DB):", error);
        return { success: false, msg: "Security Check Failed" };
    }
}

// ... global limits (unchanged wrappers) ...
// 1. strictGlobalLimiter: 10 req / 10 mins -> Block 1 hr
export async function checkRateLimit(identifier: string) {
    return await checkStrictLimit(identifier, 10, 10 * 60, 60 * 60); 
}

// 2. Creation Limiter: 2 accounts / 24h -> Block 24h
export async function checkCreationLimit(identifier: string) {
    return await checkStrictLimit(identifier, 2, 24 * 60 * 60, 24 * 60 * 60);
}

// 3. Admin: 5 attempts / 15m -> Block 1h
export async function checkAdminLoginLimit(identifier: string) {
    return await checkStrictLimit(identifier, 5, 15 * 60, 60 * 60); 
}

// 4. Client Profile Update: 3 attempts / 1 hour -> Block 1h
export async function checkProfileUpdateLimit(identifier: string) {
    return await checkStrictLimit(identifier, 3, 60 * 60, 60 * 60);
}

// 5. OTP Generation Limit: 4 attempts / 1 min (global?)
export async function checkOtpLimit(identifier: string) {
    return await checkStrictLimit(identifier, 4, 60, 10 * 60); 
}

// 8. Status Check Limiter (Looser): 100 req / 5 mins -> Block 10 mins
// Prefixed Key to avoid collision with strict global block
export async function checkStatusLimit(identifier: string) {
    return await checkStrictLimit(`status:${identifier}`, 100, 5 * 60, 10 * 60);
}

// 6. OTP Verification Block Check
export async function checkOtpVerifyBlock(identifier: string) {
     const now = new Date();
     try {
        await connectDB();
        const record = await RateLimit.findOne({ key: identifier });
        if (record && record.blockedUntil && record.blockedUntil > now) {
             const remainingBlock = Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000);
             return { success: false, blocked: true, msg: `Too many failed attempts. Blocked for ${Math.ceil(remainingBlock / 60)} minutes.` };
        }
        return { success: true };
     } catch (e) {
         return { success: false, msg: "Security Check Failed" };
     }
}

// 7. Increment Verify Failure (Atomic)
export async function incrementOtpVerifyFailure(identifier: string) {
    const limitCount = 5;
    const blockDurationSeconds = 15 * 60; // 15 mins
    const windowSeconds = 10 * 60; // 10 mins window
    
    try {
        await connectDB();
        const now = new Date();

        // 1. Clean up expired check
        let record = await RateLimit.findOne({ key: identifier });
        if (record && record.expiresAt < now && !record.blockedUntil) {
             await RateLimit.deleteOne({ _id: record._id });
             record = null;
        }

        // 2. Atomic Increment
        record = await RateLimit.findOneAndUpdate(
            { key: identifier },
            { 
                 $inc: { count: 1 },
                 $setOnInsert: { expiresAt: new Date(now.getTime() + windowSeconds * 1000) }
            },
            { upsert: true, new: true }
        );
        
        console.log(`[RateLimit-Verify] Key: ${identifier} | Count: ${record.count}`);

        if (record.count >= limitCount) {
             console.warn(`[SECURITY] Blocking Verify ${identifier} for ${blockDurationSeconds}s.`);
             record.blockedUntil = new Date(now.getTime() + blockDurationSeconds * 1000);
             record.expiresAt = new Date(now.getTime() + blockDurationSeconds * 1000 + 60000); 
             await record.save();
        }
    } catch (e) {
        console.error("Rate Limit Inc Verify Error:", e);
    }
}
