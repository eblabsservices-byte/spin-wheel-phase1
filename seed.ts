import "dotenv/config";
import mongoose from "mongoose";
import Contest from "./src/models/Contest";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in .env file");
    process.exit(1);
}

const mongoUri: string = MONGODB_URI;

const prizes = [
    { id: "p1", label: "iPhone 17", weight: 0.001, quantity: 1, type: "iphone", angle: 0 },
    { id: "p2", label: "Haier Smart TV", weight: 0.001, quantity: 1, type: "gift", angle: 45 },
    { id: "p3", label: "iBell Airfryer", weight: 0.01, quantity: 10, type: "gift", angle: 90 },
    { id: "p4", label: "JBL GO Speaker", weight: 0.01, quantity: 10, type: "gift", angle: 135 },
    { id: "p5", label: "Shirt", weight: 0.05, quantity: 50, type: "gift", angle: 180 },
    { id: "p6", label: "Saree", weight: 0.05, quantity: 50, type: "gift", angle: 225 },
    { id: "p7", label: "₹500 Voucher", weight: 1.0, quantity: 1000, type: "coupon", angle: 270 },
    { id: "p8", label: "₹100 Voucher", weight: 98, quantity: 999999, type: "coupon", angle: 315 },
];

async function seed() {
    try {
        console.log("Attempting to connect...");
        await mongoose.connect(mongoUri);
        console.log(`Connected to DB: ${mongoose.connection.name}`);

        await Contest.deleteMany({});
        console.log("Cleared existing contests");

        const contest = await Contest.create({
            name: "Launch Event Contest",
            active: true,
            prizes,
        });

        console.log("Seed Create Result:", contest._id);

        const verify = await Contest.find({});
        console.log(`Verification: Found ${verify.length} contests in DB.`);

        await new Promise(resolve => setTimeout(resolve, 2000));
        process.exit(0);
    } catch (e) {
        console.error("SEED ERROR:", e);
        process.exit(1);
    }
}

seed();
