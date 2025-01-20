import { Router } from "express";
import { jwtVerify } from "../middlewares/userauth.middleware.js";
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
} from "../controllers/like.controller.js"

const router = Router();

router.route("/toggle/c/:commentId").post(jwtVerify,toggleCommentLike);
router.route("/toggle/t/:commentId").post(jwtVerify,toggleTweetLike);
router.route("/toggle/v/:videoId").post(jwtVerify,toggleVideoLike);
router.route("/videos").get(jwtVerify,getLikedVideos)

export default router;