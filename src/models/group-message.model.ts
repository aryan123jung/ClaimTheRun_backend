import mongoose, { Document, Schema } from "mongoose";

export interface IGroupMessage extends Document {
  _id: mongoose.Types.ObjectId;
  communityId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const groupMessageSchema = new Schema<IGroupMessage>(
  {
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  },
);

groupMessageSchema.index({ communityId: 1, createdAt: 1 });

export const GroupMessageModel = mongoose.model<IGroupMessage>(
  "GroupMessage",
  groupMessageSchema,
);
