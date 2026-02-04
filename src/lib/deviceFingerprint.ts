import { NextRequest } from "next/server";
import crypto from 'crypto';

export function getDeviceFingerprint(req: NextRequest): string {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown-ip";
    const userAgent = req.headers.get("user-agent") || "unknown-ua";
    
    // In a real scenario, we might want a more robust client-generated fingerprint passed in headers
    // For now, we use a simple server-side composite or the one passed from client if available
    
    const clientFingerprint = req.headers.get("x-device-fingerprint");
    if (clientFingerprint) return clientFingerprint;

    // Fallback to strict IP+UA
    return `${ip}|${userAgent}`;
}

export function generateDeviceSignature(ip: string, signals: any): string {
    if (!signals) return 'unknown-signature';
    
    // Composite String: IP + GPU + Screen
    // Example: "192.168.1.1|ANGLE (NVIDIA...)|1920x1080"
    const rawSignature = `${ip}|${signals.gpu || 'unknown'}|${signals.screen || 'unknown'}`;
    
    // Hash it for privacy/index capability
    return crypto.createHash('sha256').update(rawSignature).digest('hex');
}
