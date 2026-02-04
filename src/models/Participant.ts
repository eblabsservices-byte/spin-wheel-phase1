import mongoose, { Schema, Document, models } from "mongoose";

export interface IParticipant extends Document {
    name: string;
    phone?: string;
    email?: string;
    googleId?: string;
    phoneVerified: boolean;
    hasSpun: boolean;
    prize?: string; 
    giftLabel?: string; 
    redeemCode?: string;
    
    // Security
    fingerprint?: string;
    deviceSignature?: string;
    deviceDetails?: any;
    ipAddress?: string;
    
    loginHistory: {
        ip: string;
        deviceFingerprint?: string;
        timestamp: Date;
    }[];

    playCount: number;
    blocked: boolean; 
    blockedUntil?: Date;
    sessionVersion: number;
    
    // OTP Storage
    otpCode?: string;
    otpExpires?: Date;
    
    // Terms Agreement
    termsAgreed?: boolean;
    termsAgreedAt?: Date; 
    
    createdAt: Date;
    updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, unique: true, sparse: true }, // Verified via OTP or added after Google Auth
        email: { type: String, unique: true, sparse: true, lowercase: true, trim: true }, // Google Email
        googleId: { type: String, unique: true, sparse: true, index: true }, // Google Auth ID

        phoneVerified: { type: Boolean, default: false },

        hasSpun: { type: Boolean, default: false },
        prize: { type: String },
        giftLabel: { type: String },

        redeemCode: {
            type: String,
            unique: true,
            sparse: true,
        },

        // Security
        fingerprint: { type: String, index: true },
        deviceSignature: { type: String, index: true }, 
        deviceDetails: { type: Object },
        ipAddress: String, // Last IP
        
        loginHistory: [{
            ip: String,
            deviceFingerprint: String,
            timestamp: { type: Date, default: Date.now }
        }],

        playCount: { type: Number, default: 0 },
        blocked: { type: Boolean, default: false },
        blockedUntil: { type: Date }, // Temporary 24h block
        
        sessionVersion: { type: Number, default: 0 }, // For invalidating all sessions
        
        // OTP Storage
        otpCode: { type: String, select: false }, // Do not return by default
        otpExpires: { type: Date },

        // Terms Agreement
        termsAgreed: { type: Boolean, default: false },
        termsAgreedAt: { type: Date },
    },
    { timestamps: true },
);

export default models.Participant || mongoose.model<IParticipant>("Participant", ParticipantSchema);
