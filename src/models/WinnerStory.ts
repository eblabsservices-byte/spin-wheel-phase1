import mongoose, { Schema } from 'mongoose';

const WinnerStorySchema = new Schema({
  imageUrl: { 
    type: String, 
    required: true 
  }, // Storing as Base64 for now to avoid external storage dependency
  prizeLabel: { 
    type: String, 
    required: true,
    enum: [
      'iPhone 17', 
      'Haier Smart TV', 
      'iBell Airfryer', 
      'JBL GO Speaker', 
      'Shirt', 
      'Saree', 
      '₹500 Voucher', 
      '₹100 Voucher',
      'Voucher'
    ]
  },
  priority: { 
    type: Number, 
    required: true 
  }, // 1 is highest
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Prevent overwrite (Force refresh in dev to apply schema changes)
if (process.env.NODE_ENV === 'development' && mongoose.models.WinnerStory) {
  delete mongoose.models.WinnerStory;
}

export const WinnerStory = mongoose.models.WinnerStory || mongoose.model("WinnerStory", WinnerStorySchema);
