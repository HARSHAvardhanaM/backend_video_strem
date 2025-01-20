import { Router } from "express";
import { jwtVerify } from "../middlewares/userauth.middleware.js";
import {
    getChannelStats, 
    getChannelVideos
} from "../controllers/dashboard.controller.js"

const router = Router();

router.use(jwtVerify); 

router.route("/stats/:channelId").get(getChannelStats);
router.route("/videos/:channelId").get(getChannelVideos);
export default router;