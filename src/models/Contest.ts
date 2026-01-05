import mongoose, { Schema, models } from "mongoose";

const PrizeSchema = new Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    weight: { type: Number, required: true }, // Chance weight (e.g. 10, 50, 0.1)
    quantity: { type: Number, required: true, default: 0 }, // Atomic stock
    type: { type: String, enum: ['cash', 'gift', 'coupon', 'none', 'iphone'], default: 'gift' },
    angle: { type: Number, required: true }, // Visual angle on wheel
    count: { type: Number, default: 0 }, // Track how many times won
    redeemCondition: { type: String } // "Min ₹1000 purchase" etc.
});

const ContestSchema = new Schema({
    name: { type: String, default: "Default Contest" },
    active: { type: Boolean, default: true },
    totalSpins: { type: Number, default: 0 }, // Global atomic counter for deterministic logic
    prizes: [PrizeSchema]
});

export default models.Contest || mongoose.model("Contest", ContestSchema);
