
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable');
  process.exit(1);
}

// Minimal Schema Definition for the update
const ParticipantSchema = new mongoose.Schema({
  phoneVerified: { type: Boolean, default: false },
}, { strict: false }); // Use strict false to just update this field on existing docs

const Participant = mongoose.models.Participant || mongoose.model('Participant', ParticipantSchema);

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI as string);
        console.log('Connected.');

        console.log('Updating all participants to phoneVerified: true...');
        
        const result = await Participant.updateMany(
            {}, 
            { $set: { phoneVerified: true } }
        );

        console.log(`Migration complete.`);
        console.log(`Matched: ${result.matchedCount}`);
        console.log(`Modified: ${result.modifiedCount}`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
        process.exit();
    }
}

migrate();
