import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";

const router = Router();
const controller = new NotificationController();

router.get("/", requireAuth, controller.getNotifications);
router.patch("/:notificationId/read", requireAuth, controller.markRead);
router.patch("/read-all", requireAuth, controller.markAllRead);

export default router;
