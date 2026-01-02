import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SESSION_SECRET = process.env.SESSION_SECRET || "default-secret-REPLACE_ME_IN_PROD";
const COOKIE_NAME = "participant_session";

// 7 days
const MAX_AGE = 60 * 60 * 24 * 7;

export interface SessionPayload {
    participantId: string;
    version: number;
    email?: string;
    role?: "user";
}

export function signToken(payload: SessionPayload): string {
    return jwt.sign(payload, SESSION_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionPayload | null {
    try {
        return jwt.verify(token, SESSION_SECRET) as SessionPayload;
    } catch (error) {
        return null;
    }
}

export async function createSession(payload: SessionPayload) {
    const token = signToken(payload);
    const cookieStore = await cookies();
    
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: MAX_AGE,
        path: "/",
    });
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    
    if (!token) return null;
    
    return verifyToken(token);
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}
