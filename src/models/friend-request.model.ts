import mongoose, { Document, Schema } from "mongoose";

export type FriendRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface IFriendRequest extends Document {
  _id: mongoose.Types.ObjectId;
  requesterId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const friendRequestSchema = new Schema<IFriendRequest>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  },
);

friendRequestSchema.index(
  { requesterId: 1, recipientId: 1 },
  { unique: true },
);

export const FriendRequestModel = mongoose.model<IFriendRequest>(
  "FriendRequest",
  friendRequestSchema,
);
