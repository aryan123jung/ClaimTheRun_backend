import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  caption: string;
  imageUrl?: string;
  likes: mongoose.Types.ObjectId[];
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const postMongoSchema = new Schema<IPost>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    caption: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    imageUrl: {
      type: String,
      required: false,
      trim: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const PostModel = mongoose.model<IPost>("Post", postMongoSchema);
