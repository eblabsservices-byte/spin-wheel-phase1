const { connectDB } = require('./src/lib/mongodb');
const Participant = require('./src/models/Participant').default;

async function checkOtp(phone) {
    await connectDB();
    console.log("Checking OTP for:", phone);
    
    // 1. Raw query to check strictly what's in DB (bypassing some Mongoose magic if needed)
    const user = await Participant.findOne({ phone }).select('+otpCode');
    
    if (user) {
        console.log("User Found:", user.name);
        console.log("OTP Code in DB:", user.otpCode); // Should be string
        console.log("OTP Expires:", user.otpExpires);
        console.log("Now:", new Date());
    } else {
        console.log("User Not Found");
    }
    process.exit(0);
}

checkOtp("7356387317");
