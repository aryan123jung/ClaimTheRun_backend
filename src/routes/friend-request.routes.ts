import { Router } from "express";
import { FriendRequestController } from "../controllers/friend-request.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";

const router = Router();
const controller = new FriendRequestController();

router.get("/search", requireAuth, controller.searchUsers);
router.get("/requests/incoming", requireAuth, controller.getIncomingRequests);
router.get("/requests/outgoing", requireAuth, controller.getOutgoingRequests);
router.post("/requests/:userId", requireAuth, controller.sendRequest);
router.delete("/requests/:userId", requireAuth, controller.cancelRequest);
router.post("/requests/:requestId/accept", requireAuth, controller.acceptRequest);
router.post("/requests/:requestId/reject", requireAuth, controller.rejectRequest);
router.delete("/:userId", requireAuth, controller.unfriend);

export default router;
