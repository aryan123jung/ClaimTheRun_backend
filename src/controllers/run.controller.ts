import z from "zod";
import { Response } from "express";
import { CreateRunDto } from "../dtos/run.dtos.ts";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { RunService } from "../services/run.services.ts";

const runService = new RunService();

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export class RunController {
  async createRun(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = CreateRunDto.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsed.error),
        });
      }

      const data = await runService.createRun(req.user!.id, parsed.data);
      return res.status(201).json({
        success: true,
        message: "Run saved successfully",
        data,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getMyRuns(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await runService.getMyRuns(req.user!.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getRunsByUserId(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await runService.getRunsByUserId(getParam(req.params.userId));
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getLatestTerritories(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await runService.getLatestTerritories();
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async deleteRun(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await runService.deleteRun(
        getParam(req.params.runId),
        req.user!.id,
      );
      return res.status(200).json({
        success: true,
        message: "Run deleted successfully",
        data,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
