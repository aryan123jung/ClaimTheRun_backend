import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";

let authController = new AuthController();

const router = Router();
router.post("/register", authController.createUser)
router.post("/login", authController.loginUser)
router.get("/me", requireAuth, authController.getCurrentUser)
router.put("/me", requireAuth, authController.updateCurrentUser)

export default router;
