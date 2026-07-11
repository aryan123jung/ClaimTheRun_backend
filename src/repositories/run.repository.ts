import mongoose from "mongoose";
import { IRun, RunModel } from "../models/run.model.ts";

export class RunRepository {
  async createRun(runData: Partial<IRun>) {
    const run = new RunModel(runData);
    await run.save();
    return this.getRunById(run._id.toString());
  }

  async getRunById(runId: string) {
    return RunModel.findById(runId).populate(
      "userId",
      "fullname username profileUrl",
    );
  }

  async getRunsByUserId(userId: string) {
    return RunModel.find({ userId })
      .populate("userId", "fullname username profileUrl")
      .sort({ createdAt: -1 });
  }

  async getLatestTerritoryRuns() {
    const latestRunIds = await RunModel.aggregate([
      {
        $match: {
          "territoryPoints.2": { $exists: true },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: "$userId",
          latestRunId: { $first: "$_id" },
        },
      },
    ]);

    if (latestRunIds.length == 0) {
      return [];
    }

    const ids = latestRunIds.map((item) => item.latestRunId);
    const runs = await RunModel.find({ _id: { $in: ids } })
      .populate("userId", "fullname username profileUrl")
      .sort({ createdAt: -1 });

    return runs;
  }

  async deleteRun(runId: string, userId: string) {
    return RunModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(runId),
      userId: new mongoose.Types.ObjectId(userId),
    });
  }
}
