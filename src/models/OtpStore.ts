import mongoose, { Schema, Document, models } from "mongoose";

export interface IOtpStore extends Document {
    phone: string;
    otpCode: string;
    tempName: string; // Store name temporarily until verification
    expiresAt: Date;
    createdAt: Date;
}

const OtpStoreSchema = new Schema<IOtpStore>(
    {
        phone: { type: String, required: true, unique: true },
        otpCode: { type: String, required: true },
        tempName: { type: String, default: "Guest" },
        expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Auto-delete after expiry
    },
    { timestamps: true }
);

export default models.OtpStore || mongoose.model<IOtpStore>("OtpStore", OtpStoreSchema);
