import mongoose, { Schema, type Document } from "mongoose";

export type CredentialStatus = "never_tested" | "passed" | "failed";

export interface ICredential extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  provider: string;
  encryptedData: string;
  status: CredentialStatus;
  lastTestedAt?: Date;
  lastTestError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CredentialSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true },
    encryptedData: { type: String, required: true },
    status: {
      type: String,
      enum: ["never_tested", "passed", "failed"],
      default: "never_tested",
    },
    lastTestedAt: { type: Date },
    lastTestError: { type: String },
  },
  { timestamps: true },
);

CredentialSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<ICredential>("Credential", CredentialSchema);
