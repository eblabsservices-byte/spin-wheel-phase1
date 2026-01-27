import mongoose from "mongoose";

declare global {
    // eslint-disable-next-line no-var
    var mongooseCache:
        | {
              conn: typeof mongoose | null;
              promise: Promise<typeof mongoose> | null;
          }
        | undefined;
}

const cached = global.mongooseCache ?? {
    conn: null,
    promise: null,
};

global.mongooseCache = cached;

// ✅ Freeze env var into a guaranteed string
const MONGODB_URI: string = (() => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined");
    }
    return process.env.MONGODB_URI;
})();

export async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000, // Fail fast (5s instead of 30s) if DB is down
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log("✅ MongoDB Connected Successfully");
            return mongoose;
        }).catch((err) => {
            console.error("❌ MongoDB Connection Error:", err);
            cached.promise = null; // Reset promise so we try again next time
            throw err;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
