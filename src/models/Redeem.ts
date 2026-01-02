import mongoose, { Schema, models, SchemaTypes } from "mongoose";

const RedeemSchema = new Schema({
    participantId: { type: SchemaTypes.ObjectId, ref: 'Participant', required: true, index: true },
    prizeId: { type: String, required: true },
    prizeLabel: { type: String, required: true },
    status: { type: String, enum: ['pending', 'claimed', 'rejected'], default: 'pending' },
    rejectionReason: { type: String },
    contact: {
        name: String,
        phone: String,
        address: String
    },
}, { timestamps: true });

export default models.Redeem || mongoose.model("Redeem", RedeemSchema);
