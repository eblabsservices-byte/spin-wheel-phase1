import mongoose, { Schema, Document, models } from "mongoose";

export interface IAdmin extends Document {
  username: string;
  passwordHash: string;
  role: 'developer' | 'admin';
  activeSessions: {
    token: string;
    ip: string;
    userAgent: string;
    createdAt: Date;
    lastActive: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['developer', 'admin'], default: 'admin' },
    activeSessions: [
      {
        token: { type: String, required: true },
        ip: { type: String },
        userAgent: { type: String },
        createdAt: { type: Date, default: Date.now },
        lastActive: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);
