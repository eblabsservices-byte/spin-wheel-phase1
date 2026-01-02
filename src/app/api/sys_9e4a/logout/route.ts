import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;

    if (sessionToken) {
        await connectDB();
        await Admin.updateOne(
            { "activeSessions.token": sessionToken },
            { $pull: { activeSessions: { token: sessionToken } } }
        );
    }
    
    // Clear Cookie
    const response = NextResponse.json({ success: true });
    
    // Create a new cookie with expired date to delete it
    response.cookies.set("admin_session", "", {
        httpOnly: true,
        expires: new Date(0), 
        path: "/",
        secure: process.env.NODE_ENV === "production", 
        sameSite: "strict" 
    });
    return response;
}