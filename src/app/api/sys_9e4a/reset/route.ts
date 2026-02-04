// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/mongodb";
// import Participant from "@/models/Participant";
// import Contest from "@/models/Contest";
// import Redeem from "@/models/Redeem";
// import Admin from "@/models/Admin";
// import { cookies } from "next/headers";
// // Force rebuild

// const INITIAL_PRIZES = [
//     { 
//         id: "p1", 
//         label: "iPhone 17", 
//         quantity: 1, 
//         weight: 0, 
//         angle: 0, 
//         type: 'iphone',
//         redeemCondition: "Grand Prize! Collect from Store"
//     },
//     { 
//         id: "p2", 
//         label: "Haier Smart TV", 
//         quantity: 1, 
//         weight: 0, 
//         angle: 45, 
//         type: 'gift',
//         redeemCondition: "Collect from Store"
//     },
//     { 
//         id: "p3", 
//         label: "iBell Airfryer", 
//         quantity: 10, 
//         weight: 0, 
//         angle: 90, 
//         type: 'gift',
//         redeemCondition: "Collect from Store"
//     },
//     { 
//         id: "p4", 
//         label: "JBL GO Speaker", 
//         quantity: 4, 
//         weight: 0, 
//         angle: 135, 
//         type: 'gift',
//         redeemCondition: "Collect from Store"
//     },
//     { 
//         id: "p5", 
//         label: "Shirt", 
//         quantity: 50, 
//         weight: 0, 
//         angle: 180, 
//         type: 'gift',
//         redeemCondition: "Collect from Store"
//     },
//     { 
//         id: "p6", 
//         label: "Saree", 
//         quantity: 50, 
//         weight: 0, 
//         angle: 225, 
//         type: 'gift',
//         redeemCondition: "Collect from Store"
//     },
//     { 
//         id: "p7", 
//         label: "₹500 Voucher", 
//         quantity: 1000, 
//         weight: 0, 
//         angle: 270, 
//         type: 'coupon',
//         redeemCondition: "Min purchase ₹5000"
//     },
//     { 
//         id: "p8", 
//         label: "₹100 Voucher", 
//         quantity: 999999, // Unlimited
//         weight: 0, 
//         angle: 315, 
//         type: 'coupon',
//         redeemCondition: "Min purchase ₹1000"
//     },
// ];

// export async function POST(req: Request) {
//     try {
//         await connectDB();

//         // Security Check
//         const cookieStore = await cookies();
//         const adminSession = cookieStore.get("admin_session");

//         if (!adminSession?.value) {
//              return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         }

//         // Verify session in DB
//         const admin = await Admin.findOne({ "activeSessions.token": adminSession.value });
//         if (!admin) {
//              return NextResponse.json({ error: "Invalid Session" }, { status: 401 });
//         }

//         // 1. Clear Data
//         await Participant.deleteMany({});
//         await Redeem.deleteMany({});
//         await Contest.deleteMany({});

//         // 2. Reseed Contest
//         await Contest.create({
//             name: "YB Lucky Wheel 2024 - Deterministic",
//             active: true,
//             totalSpins: 0,
//             prizes: INITIAL_PRIZES
//         });

//         return NextResponse.json({ 
//             success: true, 
//             message: "Database reset. Prizes re-seeded with Deterministic Logic." 
//         });

//     } catch (error) {
//         console.error("Reset Error:", error);
//         return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//     }
// }
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    return NextResponse.json({ error: "Reset functionality is disabled" }, { status: 403 });
}