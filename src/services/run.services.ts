import mongoose from "mongoose";
import { CreateRunDto } from "../dtos/run.dtos.ts";
import { HttpError } from "../errors/http-error.ts";
import { RunRepository } from "../repositories/run.repository.ts";
import { UserRepository } from "../repositories/user.repository.ts";

const runRepository = new RunRepository();
const userRepository = new UserRepository();

export class RunService {
  async createRun(userId: string, runData: CreateRunDto) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const run = await runRepository.createRun({
      userId: new mongoose.Types.ObjectId(userId),
      title: runData.title?.trim() || undefined,
      routePoints: runData.routePoints,
      territoryPoints: runData.territoryPoints,
      distanceMeters: runData.distanceMeters,
      durationSeconds: runData.durationSeconds,
    });

    return this.serializeRun(run);
  }

  async getMyRuns(userId: string) {
    const runs = await runRepository.getRunsByUserId(userId);
    return runs.map((run) => this.serializeRun(run));
  }

  async getRunsByUserId(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const runs = await runRepository.getRunsByUserId(userId);
    return runs.map((run) => this.serializeRun(run));
  }

  async getLatestTerritories() {
    const runs = await runRepository.getLatestTerritoryRuns();
    return runs.map((run) => this.serializeRun(run));
  }

  async deleteRun(runId: string, userId: string) {
    const deleted = await runRepository.deleteRun(runId, userId);
    if (!deleted) {
      throw new HttpError(404, "Run not found");
    }
    return {
      id: runId,
    };
  }

  private serializeRun(run: any) {
    const user = run?.userId;
    return {
      id: run._id.toString(),
      title: run.title?.toString?.().trim?.() || null,
      distanceMeters: run.distanceMeters ?? 0,
      durationSeconds: run.durationSeconds ?? 0,
      routePoints: Array.isArray(run.routePoints)
        ? run.routePoints.map((point: any) => ({
            latitude: point.latitude,
            longitude: point.longitude,
          }))
        : [],
      territoryPoints: Array.isArray(run.territoryPoints)
        ? run.territoryPoints.map((point: any) => ({
            latitude: point.latitude,
            longitude: point.longitude,
          }))
        : [],
      createdAt: run.createdAt,
      user: {
        id: user?._id?.toString?.() ?? "",
        fullname: user?.fullname ?? "Unknown Runner",
        username: user?.username ?? "",
        profileUrl: user?.profileUrl ?? null,
      },
    };
  }
}
