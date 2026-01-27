import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Participant from "@/models/Participant";
import Redeem from "@/models/Redeem";

import { isAuthenticated } from "@/lib/auth";
// Removed local isAuthenticated helper


export async function GET(req: Request) {
    try {
        // Auth Check
        const isAuth = await isAuthenticated(req);
        if (!isAuth) {
             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const sortField = searchParams.get("sortField") || "createdAt"; 
        const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

        await connectDB();

        // MongoDB Aggregation Pipeline
        const pipeline: any[] = [];

        // 1. LOOKUP (Join with Redeem collection)
        // We join to get the 'status' and 'redeemCode' if it differs
        pipeline.push({
            $lookup: {
                from: "redeems", // Collection name (usually pluralized lowercase)
                localField: "_id",
                foreignField: "participantId",
                as: "redeemInfo"
            }
        });

        // 2. Simplification: Take first redeem info only to prevent duplicates
        // Instead of $unwind which multiplies rows if multiple redeems exist,
        // we just take the first one. `redeemInfo` becomes an object or null.
        pipeline.push({
            $addFields: {
                redeemInfo: { $arrayElemAt: ["$redeemInfo", 0] }
            }
        });

        // 3. PROJECT (Flatten fields for easier searching/sorting)
        pipeline.push({
            $project: {
                _id: 1,
                name: 1,
                phone: 1,
                createdAt: 1,
                phoneVerified: 1,
                hasSpun: 1,
                giftLabel: { $ifNull: ["$giftLabel", "-"] }, // Default to "-"
                prizeId: 1,
                // Accessing joined fields
                redeemCode: { $ifNull: ["$redeemInfo.redeemCode", "$redeemCode", "-"] }, // Try redeem doc first, then user doc
                redeemStatus: { 
                    $ifNull: ["$redeemInfo.status", { 
                        $cond: { if: "$hasSpun", then: "unclaimed", else: "-" } 
                    }] 
                }, 
                rejectionReason: "$redeemInfo.rejectionReason"
            }
        });

        // 4. MATCH (Global Search)
        if (search) {
            const regex = { $regex: search, $options: "i" };
            // Check if search term is 'pending', 'claimed', 'rejected' directly for status search
            // Or apply regex potentially to status if needed
            
            pipeline.push({
                $match: {
                    $or: [
                        { name: regex },
                        { phone: regex },
                        { giftLabel: regex },
                        { redeemCode: regex },
                        { redeemStatus: regex }, 
                    ]
                }
            });
        }

        // 5. SORT
        const sortStage: any = {};
        // Map frontend sort fields to projected fields
        if (sortField === 'date') sortStage['createdAt'] = sortOrder; // Handle common mismatch
        else sortStage[sortField] = sortOrder;
        
        pipeline.push({ $sort: sortStage });

        // 6. FACET (Pagination + Total Count in one go)
        pipeline.push({
            $facet: {
                metadata: [{ $count: "total" }],
                data: [{ $skip: (page - 1) * limit }, { $limit: limit }]
            }
        });

        const result = await Participant.aggregate(pipeline);

        const metadata = result[0].metadata[0] || { total: 0 };
        const data = result[0].data;

        return NextResponse.json({
            data,
            pagination: {
                total: metadata.total,
                page,
                limit,
                totalPages: Math.ceil(metadata.total / limit)
            }
        });

    } catch (error) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
