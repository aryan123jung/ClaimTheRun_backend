import { Router } from "express";
import { CommunityController } from "../controllers/community.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import { communityImageUpload } from "../middlewares/upload.middleware.ts";

const router = Router();
const controller = new CommunityController();

router.get("/my", requireAuth, controller.getMyCommunities);
router.get("/search", requireAuth, controller.searchCommunities);
router.get("/:communityId", requireAuth, controller.getCommunityById);
router.get("/:communityId/posts", requireAuth, controller.getCommunityPosts);
router.get("/:communityId/messages", requireAuth, controller.getCommunityMessages);
router.post(
  "/",
  requireAuth,
  communityImageUpload.single("groupImage"),
  controller.createCommunity,
);
router.post("/:communityId/messages", requireAuth, controller.sendCommunityMessage);
router.post("/:communityId/join", requireAuth, controller.joinCommunity);
router.post("/:communityId/leave", requireAuth, controller.leaveCommunity);

export default router;
