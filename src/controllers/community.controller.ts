import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { toUploadPath } from "../middlewares/upload.middleware.ts";
import { CommunityService } from "../services/community.services.ts";

const communityService = new CommunityService();

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export class CommunityController {
  async createCommunity(req: AuthenticatedRequest, res: Response) {
    try {
      const imageUrl = toUploadPath(req.file, "communities/images");
      const community = await communityService.createCommunity(req.user!.id, {
        name: req.body.name?.toString?.() ?? "",
        description: req.body.description?.toString?.() ?? "",
        imageUrl,
      });

      return res.status(201).json({
        success: true,
        message: "Group created successfully",
        data: community,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getMyCommunities(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await communityService.getMyCommunities(req.user!.id);
      return res.status(200).json({ success: true, data });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async searchCommunities(req: AuthenticatedRequest, res: Response) {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const data = await communityService.searchCommunities(req.user!.id, search);
      return res.status(200).json({ success: true, data });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getCommunityById(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await communityService.getCommunityById(
        getParam(req.params.communityId),
        req.user!.id,
      );
      return res.status(200).json({ success: true, data });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async joinCommunity(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await communityService.joinCommunity(
        getParam(req.params.communityId),
        req.user!.id,
      );
      return res.status(200).json({
        success: true,
        message: "Joined group successfully",
        data,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async leaveCommunity(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await communityService.leaveCommunity(
        getParam(req.params.communityId),
        req.user!.id,
      );
      return res.status(200).json({
        success: true,
        message: "Left group successfully",
        data,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getCommunityPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await communityService.getCommunityPosts(
        getParam(req.params.communityId),
        req.user!.id,
      );
      return res.status(200).json({ success: true, data });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
