import mongoose, { Document, Schema } from "mongoose";

export type NotificationKind = "FRIEND_REQUEST_SENT" | "FRIEND_REQUEST_ACCEPTED";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  requestId?: mongoose.Types.ObjectId;
  type: NotificationKind;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "FriendRequest",
      required: false,
    },
    type: {
      type: String,
      enum: ["FRIEND_REQUEST_SENT", "FRIEND_REQUEST_ACCEPTED"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const NotificationModel = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
