import { Router } from "express";
import { RunController } from "../controllers/run.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";

const router = Router();
const controller = new RunController();

router.get("/me", requireAuth, controller.getMyRuns);
router.get("/user/:userId", requireAuth, controller.getRunsByUserId);
router.get("/territories", requireAuth, controller.getLatestTerritories);
router.post("/", requireAuth, controller.createRun);
router.delete("/:runId", requireAuth, controller.deleteRun);

export default router;
