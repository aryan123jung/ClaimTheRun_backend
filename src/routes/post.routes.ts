import { Router } from "express";
import { PostController } from "../controllers/post.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";

const router = Router();
const postController = new PostController();

router.get("/me", requireAuth, postController.getMyPosts);
router.get("/", requireAuth, postController.getPersonalFeed);
router.post("/", requireAuth, postController.createPost);
router.patch("/:id/like", requireAuth, postController.toggleLike);

export default router;
