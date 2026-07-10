import { Router } from "express";
import { MessageController } from "../controllers/message.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";

const router = Router();
const controller = new MessageController();

router.get("/conversations", requireAuth, controller.getConversations);
router.post(
  "/conversations/:otherUserId",
  requireAuth,
  controller.getOrCreateConversation,
);
router.get("/:conversationId", requireAuth, controller.getMessages);
router.post("/:conversationId", requireAuth, controller.sendMessage);
router.patch(
  "/:conversationId/read",
  requireAuth,
  controller.markConversationRead,
);

export default router;
