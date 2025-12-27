import mongoose, { Schema, Document, models } from "mongoose";

export interface IRateLimit extends Document {
    key: string;
    count: number;
    blockedUntil?: Date;
    expiresAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>(
    {
        key: { type: String, required: true, unique: true },
        count: { type: Number, default: 0 },
        blockedUntil: { type: Date },
        expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL Index
    },
    { timestamps: true }
);

export default models.RateLimit || mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);
