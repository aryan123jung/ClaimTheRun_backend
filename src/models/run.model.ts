import mongoose, { Document, Schema } from "mongoose";

const runPointSchema = new Schema(
  {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  },
);

export interface IRun extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  routePoints: Array<{
    latitude: number;
    longitude: number;
  }>;
  territoryPoints: Array<{
    latitude: number;
    longitude: number;
  }>;
  distanceMeters: number;
  durationSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

const runMongoSchema = new Schema<IRun>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    routePoints: {
      type: [runPointSchema],
      default: [],
    },
    territoryPoints: {
      type: [runPointSchema],
      default: [],
    },
    distanceMeters: {
      type: Number,
      required: true,
      min: 0,
    },
    durationSeconds: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const RunModel = mongoose.model<IRun>("Run", runMongoSchema);
