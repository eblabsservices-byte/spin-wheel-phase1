import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid'; // You might need to install 'uuid' or just use random string
import { checkAdminLoginLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
    try {
        // Enforce Content-Type
        if (!req.headers.get("content-type")?.includes("application/json")) {
             return NextResponse.json({ error: "Invalid Content-Type" }, { status: 415 });
        }

        const body = await req.json();
        const username = String(body.username || "");
        const password = String(body.password || "");

        await connectDB();
        
        // 0. Rate Limit Check
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const limitRes = await checkAdminLoginLimit(ip);
        if (!limitRes.success) {
             return NextResponse.json({ error: "Too many login attempts. Please try again in 15 minutes." }, { status: 429 });
        }

        // 1. Find User
        const admin = await Admin.findOne({ username });
        if (!admin) {
             return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // 2. Verify Password
        const isMatch = await bcrypt.compare(password, admin.passwordHash);
        if (!isMatch) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // 3. Session Concurrency Management (Max 1)
        // KICK_OLDEST Strategy
        const MAX_SESSIONS = 5;
        
        let newSessions = admin.activeSessions || [];
        
        // If we reached limit, remove the oldest one (first in array usually, or sort by createdAt)
        if (newSessions.length >= MAX_SESSIONS) {
             // Sort by creation to find oldest
             newSessions.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
             // Remove oldest (first one)
             newSessions.shift(); 
        }

        // 4. Create New Session
        // Simple random token if uuid not available, but ideally use crypto
        const sessionToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
        

        const userAgent = req.headers.get("user-agent") || "unknown";

        newSessions.push({
            token: sessionToken,
            ip,
            userAgent,
            createdAt: new Date(),
            lastActive: new Date()
        });

        admin.activeSessions = newSessions;
        await admin.save();

        // 5. Set Cookie
        const response = NextResponse.json({ success: true });
            
        response.cookies.set("admin_session", sessionToken, {
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7 // 7 days (auto expire)
        });

        return response;

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
