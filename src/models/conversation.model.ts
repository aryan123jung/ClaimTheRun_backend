import mongoose, { Document, Schema } from "mongoose";

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  participantsKey: string;
  lastMessage?: string | null;
  lastMessageSenderId?: mongoose.Types.ObjectId | null;
  lastMessageAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    participantsKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    lastMessage: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    lastMessageSenderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index({ participants: 1 });

export const ConversationModel = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema,
);
