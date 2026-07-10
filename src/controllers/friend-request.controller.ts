import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { FriendRequestService } from "../services/friend-request.services.ts";

const friendRequestService = new FriendRequestService();

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export class FriendRequestController {
  async searchUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const users = await friendRequestService.searchUsers(req.user!.id, search);
      return res.status(200).json({ success: true, data: users });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async sendRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await friendRequestService.sendRequest(
        req.user!.id,
        getParam(req.params.userId),
      );
      return res.status(201).json({ success: true, message: "Friend request sent", data });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
    }
  }

  async cancelRequest(req: AuthenticatedRequest, res: Response) {
    try {
      await friendRequestService.cancelRequest(
        req.user!.id,
        getParam(req.params.userId),
      );
      return res.status(200).json({ success: true, message: "Friend request cancelled" });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
    }
  }

  async getIncomingRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await friendRequestService.getIncomingRequests(req.user!.id);
      return res.status(200).json({ success: true, data });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
    }
  }

  async getOutgoingRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await friendRequestService.getOutgoingRequests(req.user!.id);
      return res.status(200).json({ success: true, data });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
    }
  }

  async acceptRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await friendRequestService.acceptRequest(
        req.user!.id,
        getParam(req.params.requestId),
      );
      return res.status(200).json({ success: true, message: "Friend request accepted", data });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
    }
  }

  async rejectRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await friendRequestService.rejectRequest(
        req.user!.id,
        getParam(req.params.requestId),
      );
      return res.status(200).json({ success: true, message: "Friend request rejected", data });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
    }
  }

  async unfriend(req: AuthenticatedRequest, res: Response) {
    try {
      await friendRequestService.unfriend(
        req.user!.id,
        getParam(req.params.userId),
      );
      return res.status(200).json({ success: true, message: "Friend removed" });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
    }
  }
}
