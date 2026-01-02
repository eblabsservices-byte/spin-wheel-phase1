import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

export async function isAuthenticated(req: Request) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("admin_session")?.value;

        if (!sessionToken) return false;

        await connectDB();

        // Find admin with this active session token
        const admin = await Admin.findOne({ "activeSessions.token": sessionToken });

        if (!admin) return false;

        // Optional: Update lastActive time for this session
        // const session = admin.activeSessions.find((s: any) => s.token === sessionToken);
        // if (session) session.lastActive = new Date();
        // await admin.save();

        return true;
    } catch (error) {
        console.error("Auth Check Error:", error);
        return false;
    }
}

export async function getAdminUser() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("admin_session")?.value;
        if (!sessionToken) return null;
        
        await connectDB();
        return await Admin.findOne({ "activeSessions.token": sessionToken }).lean();
    } catch (error) {
        return null;
    } 
}
